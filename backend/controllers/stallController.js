const db = require('../config/db');

const getAllStalls = async (req, res) => {
  const { zone, date } = req.query;
  try {
    let query, params = [];

    if (date) {
      query = `
        SELECT s.*,
          CASE
            WHEN EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.stall_id = s.stall_id
                AND DATE(b.market_date) = ?
                AND b.booking_status IN ('paid','approved')
            ) THEN 'occupied'
            WHEN EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.stall_id = s.stall_id
                AND DATE(b.market_date) = ?
                AND b.booking_status = 'pending'
                AND b.lock_expires_at IS NULL
            ) THEN 'occupied'
            WHEN EXISTS (
              SELECT 1 FROM bookings b
              WHERE b.stall_id = s.stall_id
                AND DATE(b.market_date) = ?
                AND b.booking_status = 'pending'
                AND b.lock_expires_at IS NOT NULL
                AND b.lock_expires_at > NOW()
            ) THEN 'processing'
            ELSE 'available'
          END AS date_status
        FROM stalls s
        WHERE 1=1
      `;
      params.push(date, date, date);
      if (zone) { query += ' AND s.stall_zone = ?'; params.push(zone); }
      query += ' ORDER BY s.stall_number';
    } else {
      // ไม่มี date → staff ดูภาพรวม ไม่มี alias s
      query = `SELECT *, stall_status AS date_status FROM stalls WHERE 1=1`;
      if (zone) { query += ' AND stall_zone = ?'; params.push(zone); }
      query += ' ORDER BY stall_number';
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  }
};

const getStallById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM stalls WHERE stall_id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบแผงนี้' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const getZones = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT DISTINCT stall_zone FROM stalls ORDER BY stall_zone');
    res.json({ success: true, data: rows.map(r => r.stall_zone) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const updateStall = async (req, res) => {
  const { stall_status, stall_rate, stall_zone } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE stalls
       SET stall_status = COALESCE(?, stall_status),
           stall_rate   = COALESCE(?, stall_rate),
           stall_zone   = COALESCE(?, stall_zone)
       WHERE stall_id = ?`,
      [stall_status, stall_rate, stall_zone, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบแผงนี้' });
    res.json({ success: true, message: 'อัปเดตสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const lockStall = async (req, res) => {
  const { id } = req.params;
  const { market_date } = req.body;
  if (!market_date) return res.status(400).json({ success: false, message: 'กรุณาระบุวันที่' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // ดึง renter_id
    const [renterRows] = await conn.query(
      'SELECT renter_id FROM renter WHERE user_id = ?', [req.user.user_id]
    );
    if (renterRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้เช่า' });
    }
    const renter_id = renterRows[0].renter_id;

    // เช็คว่าแผงนี้วันนั้นถูกจอง (จริง) หรือ lock โดยคนอื่นอยู่มั้ย
    const [existing] = await conn.query(
      `SELECT booking_id, renter_id, lock_expires_at, booking_status FROM bookings
       WHERE stall_id = ? AND DATE(market_date) = ?
         AND booking_status IN ('pending','paid','approved')`,
      [id, market_date]
    );

    for (const row of existing) {
      const isOwnLock = row.renter_id === renter_id && row.lock_expires_at !== null
      const isExpiredLock = row.lock_expires_at !== null && new Date(row.lock_expires_at) < new Date()

      // lock หมดอายุแล้ว → ลบออกก่อน
      if (isExpiredLock) {
        await conn.query('DELETE FROM bookings WHERE booking_id = ?', [row.booking_id])
        continue
      }
      // lock ของตัวเอง → ข้ามได้ (จะ extend ด้านล่าง)
      if (isOwnLock) continue
      // booking จริง หรือ lock ของคนอื่น → บล็อก
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'แผงนี้ถูกจองแล้วในวันที่เลือก' });
    }

    const lockExpires = new Date(Date.now() + 10 * 60 * 1000);

    // เช็ค lock ของตัวเองที่ยังไม่หมดอายุ
    const [existingLock] = await conn.query(
      `SELECT booking_id FROM bookings
       WHERE stall_id = ? AND DATE(market_date) = ? AND renter_id = ?
         AND booking_status = 'pending' AND lock_expires_at IS NOT NULL
         AND lock_expires_at > NOW()`,
      [id, market_date, renter_id]
    );

    let finalBookingId;

    if (existingLock.length > 0) {
      // extend lock เดิม
      finalBookingId = existingLock[0].booking_id;
      await conn.query(
        `UPDATE bookings SET lock_expires_at = ? WHERE booking_id = ?`,
        [lockExpires, finalBookingId]
      );
    } else {
      // สร้าง lock ใหม่
      finalBookingId = `b${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await conn.query(
        `INSERT INTO bookings (booking_id, renter_id, stall_id, market_date, booking_status, lock_expires_at)
         VALUES (?, ?, ?, ?, 'pending', ?)`,
        [finalBookingId, renter_id, id, market_date, lockExpires]
      );
    }

    await conn.commit();
    res.json({ success: true, booking_id: finalBookingId, lock_expires_at: lockExpires });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  } finally { conn.release(); }
};

const unlockStall = async (req, res) => {
  const { id } = req.params;
  const { market_date } = req.body;
  try {
    const [renterRows] = await db.query(
      'SELECT renter_id FROM renter WHERE user_id = ?', [req.user.user_id]
    );
    if (renterRows.length === 0)
      return res.status(404).json({ success: false, message: 'ไม่พบผู้เช่า' });

    // ลบเฉพาะ lock ของตัวเอง (pending + lock_expires_at IS NOT NULL)
    await db.query(
      `DELETE FROM bookings
       WHERE stall_id = ? AND DATE(market_date) = ? AND renter_id = ?
         AND booking_status = 'pending' AND lock_expires_at IS NOT NULL`,
      [id, market_date, renterRows[0].renter_id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

module.exports = { getAllStalls, getStallById, getZones, updateStall, lockStall, unlockStall };