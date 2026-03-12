const db = require('../config/db');

const getAllStalls = async (req, res) => {
  const { zone, status, date } = req.query;
  try {
    let query, params = [];

    if (date) {
      query = `
        SELECT s.*, 
          CASE WHEN b.booking_id IS NOT NULL THEN 'occupied' ELSE s.stall_status END as date_status
        FROM stalls s
        LEFT JOIN bookings b ON s.stall_id = b.stall_id 
          AND b.market_date = ? 
          AND b.booking_status IN ('processing','pending','approved','paid')
        WHERE 1=1
      `;
      params.push(date);
      if (zone) { query += ' AND s.stall_zone = ?'; params.push(zone); }
    } else {
      query = 'SELECT * FROM stalls WHERE 1=1';
      if (zone) { query += ' AND stall_zone = ?'; params.push(zone); }
      if (status) { query += ' AND stall_status = ?'; params.push(status); }
    }

    query += ' ORDER BY stall_number';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
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

const updateStall = async (req, res) => {
  const { stall_status, stall_rate, stall_zone } = req.body;
  try {
    const [result] = await db.query(
      'UPDATE stalls SET stall_status = COALESCE(?, stall_status), stall_rate = COALESCE(?, stall_rate), stall_zone = COALESCE(?, stall_zone) WHERE stall_id = ?',
      [stall_status, stall_rate, stall_zone, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบแผงนี้' });
    res.json({ success: true, message: 'อัปเดตข้อมูลแผงสำเร็จ' });
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

// POST /api/stalls/:id/lock
const lockStall = async (req, res) => {
  const { id } = req.params
  const { market_date } = req.body
  if (!market_date) return res.status(400).json({ success: false, message: 'กรุณาระบุวันที่' })

  const conn = await db.getConnection()
  try {
    await conn.beginTransaction()
    const [rows] = await conn.query(
      `SELECT b.booking_status, b.lock_expires_at
       FROM stalls s
       LEFT JOIN bookings b ON b.stall_id = s.stall_id
         AND b.market_date = ?
         AND b.booking_status IN ('processing','pending','approved','paid')
       WHERE s.stall_id = ? FOR UPDATE`,
      [market_date, id]
    )
    const row = rows[0]
    if (row?.booking_status === 'processing' && row?.lock_expires_at && new Date(row.lock_expires_at) > new Date()) {
      await conn.rollback()
      return res.status(409).json({ success: false, message: 'มีผู้ใช้อื่นกำลังเลือกแผงนี้อยู่ครับ' })
    }
    if (['pending','approved','paid'].includes(row?.booking_status)) {
      await conn.rollback()
      return res.status(409).json({ success: false, message: 'แผงนี้ถูกจองแล้วในวันที่เลือก' })
    }

    const lockExpires = new Date(Date.now() + 10 * 60 * 1000)
    const [existing] = await conn.query(
      `SELECT booking_id FROM bookings WHERE stall_id = ? AND market_date = ? AND booking_status = 'processing'`,
      [id, market_date]
    )
    if (existing.length > 0) {
      await conn.query(
        `UPDATE bookings SET user_id = ?, lock_expires_at = ? WHERE booking_id = ?`,
        [req.user.user_id, lockExpires, existing[0].booking_id]
      )
    } else {
      const booking_id = `bk${Date.now()}`
      await conn.query(
        `INSERT INTO bookings (booking_id, stall_id, user_id, market_date, booking_status, lock_expires_at) VALUES (?, ?, ?, ?, 'processing', ?)`,
        [booking_id, id, req.user.user_id, market_date, lockExpires]
      )
      await conn.query(`UPDATE stalls SET stall_status = 'processing' WHERE stall_id = ?`, [id])
    }
    await conn.commit()
    res.json({ success: true, lock_expires_at: lockExpires })
  } catch (err) {
    await conn.rollback()
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message })
  } finally { conn.release() }
}

// DELETE /api/stalls/:id/lock
const unlockStall = async (req, res) => {
  const { id } = req.params
  const { market_date } = req.body
  try {
    await db.query(
      `UPDATE bookings SET booking_status = 'cancelled' WHERE stall_id = ? AND market_date = ? AND user_id = ? AND booking_status = 'processing'`,
      [id, market_date, req.user.user_id]
    )
    await db.query(
      `UPDATE stalls SET stall_status = 'available' WHERE stall_id = ?
       AND NOT EXISTS (SELECT 1 FROM bookings WHERE stall_id = ? AND booking_status IN ('pending','approved','paid'))`,
      [id, id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' })
  }
}

module.exports = { getAllStalls, getStallById, getZones, updateStall, lockStall, unlockStall }
