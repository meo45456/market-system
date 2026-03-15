const db = require('../config/db');

// ─── helper: เช็คว่า renter มี active booking จริงอยู่มั้ย ───────────────────
// กฎ:
//   pending + lock_expires_at IS NULL     → รออนุมัติจริง → บล็อก
//   pending + lock_expires_at IS NOT NULL → แค่ lock      → ไม่บล็อก
//   approved + market_date >= วันนี้      → ยังเช่าอยู่   → บล็อก
//   approved + market_date < วันนี้       → เช่าเสร็จแล้ว → ไม่บล็อก
//   rejected                              → ยกเลิกแล้ว    → ไม่บล็อก
const hasActiveBooking = async (conn, renter_id) => {
  const [rows] = await conn.query(
    `SELECT booking_id FROM bookings
     WHERE renter_id = ?
       AND (
         -- รออนุมัติจริง (ส่งสลิปแล้ว)
         (booking_status = 'pending' AND lock_expires_at IS NULL)
         OR
         -- อนุมัติแล้ว และวันตลาดยังไม่ผ่าน (รวมวันนี้)
         (booking_status = 'approved' AND DATE(market_date) >= CURDATE())
       )
     LIMIT 1`,
    [renter_id]
  );
  return rows.length > 0;
};

// ─── POST /bookings ───────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  const { stall_id, market_date, payment_method, payment_amount } = req.body;
  const slip = req.file;

  if (!stall_id || !market_date)
    return res.status(400).json({ success: false, message: 'กรุณาระบุแผงและวันที่' });
  if (!slip)
    return res.status(400).json({ success: false, message: 'กรุณาแนบสลิปการโอนเงิน' });

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

    // เช็ค active booking (ห้ามจองซ้อน / จองล่วงหน้า)
    if (await hasActiveBooking(conn, renter_id)) {
      await conn.rollback();
      return res.status(409).json({
        success: false,
        message: 'คุณมีการจองที่ยังไม่เสร็จสิ้น กรุณารอให้ครบกำหนดหรือยกเลิกก่อนครับ'
      });
    }

    // เช็คว่าแผงนี้วันนั้นถูกจองจริงโดยคนอื่นมั้ย
    const [stallBooked] = await conn.query(
      `SELECT booking_id, renter_id, lock_expires_at FROM bookings
       WHERE stall_id = ? AND DATE(market_date) = ?
         AND booking_status IN ('pending','paid','approved')`,
      [stall_id, market_date]
    );

    for (const row of stallBooked) {
      const isOwnLock = row.renter_id === renter_id && row.lock_expires_at !== null
      const isExpiredLock = row.lock_expires_at !== null && new Date(row.lock_expires_at) < new Date()
      if (isExpiredLock) {
        await conn.query('DELETE FROM bookings WHERE booking_id = ?', [row.booking_id])
        continue
      }
      if (isOwnLock) continue
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'แผงนี้ถูกจองแล้วในวันที่เลือก' });
    }

    // หา lock ของตัวเองสำหรับแผง+วันนี้ (ถ้ามี → แปลงเป็น booking จริง)
    const [lockRows] = await conn.query(
      `SELECT booking_id FROM bookings
       WHERE stall_id = ? AND DATE(market_date) = ? AND renter_id = ?
         AND booking_status = 'pending' AND lock_expires_at IS NOT NULL`,
      [stall_id, market_date, renter_id]
    );

    // ดึงราคาแผง
    const [stallRows] = await conn.query(
      'SELECT stall_rate FROM stalls WHERE stall_id = ?', [stall_id]
    );
    const amount = payment_amount || stallRows[0]?.stall_rate || 0;

    let final_booking_id;

    if (lockRows.length > 0) {
      // แปลง lock → booking จริง (เคลียร์ lock_expires_at)
      final_booking_id = lockRows[0].booking_id;
      await conn.query(
        `UPDATE bookings SET lock_expires_at = NULL WHERE booking_id = ?`,
        [final_booking_id]
      );
    } else {
      // ไม่มี lock → สร้าง booking ใหม่เลย
      final_booking_id = `b${Date.now()}${Math.floor(Math.random() * 1000)}`;
      await conn.query(
        `INSERT INTO bookings (booking_id, renter_id, stall_id, market_date, booking_status)
         VALUES (?, ?, ?, ?, 'pending')`,
        [final_booking_id, renter_id, stall_id, market_date]
      );
    }

    // สร้าง payment_id
    const [lastPayment] = await conn.query(
      'SELECT payment_id FROM payments ORDER BY payment_id DESC LIMIT 1'
    );
    const lastNum = lastPayment.length > 0
      ? parseInt(lastPayment[0].payment_id.replace('p', '')) : 0;
    const payment_id = `p${String(lastNum + 1).padStart(3, '0')}`;

    // INSERT payment
    await conn.query(
      `INSERT INTO payments (payment_id, booking_id, payment_amount, payment_method, payment_slipimage, payment_status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [payment_id, final_booking_id, amount, payment_method || 'PromptPay', slip.path]
    );

    await conn.commit();
    res.status(201).json({
      success: true,
      message: 'จองแผงสำเร็จ รอเจ้าหน้าที่อนุมัติ',
      booking_id: final_booking_id,
    });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  } finally { conn.release(); }
};

// ─── GET /bookings ────────────────────────────────────────────────────────────
const getBookings = async (req, res) => {
  try {
    let query, params = [];

    if (req.user.role === 'staff') {
      // Staff เห็นทุก booking จริง (ไม่รวม lock)
      query = `
        SELECT b.booking_id, b.renter_id, b.stall_id, b.staff_id,
               DATE_FORMAT(b.market_date, '%Y-%m-%d') AS market_date,
               b.booking_date, b.booking_status, b.lock_expires_at,
               s.stall_number, s.stall_zone, s.stall_rate,
               r.renter_shopname, u.user_name,
               p.payment_id, p.payment_amount, p.payment_slipimage, p.payment_status
        FROM bookings b
        JOIN stalls s  ON b.stall_id  = s.stall_id
        JOIN renter r  ON b.renter_id = r.renter_id
        JOIN users u   ON r.user_id   = u.user_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id
        WHERE b.booking_status IN ('pending','paid','approved','rejected')
          AND b.lock_expires_at IS NULL
        ORDER BY b.booking_date DESC
      `;
    } else {
      // Renter เห็นเฉพาะ booking จริงของตัวเอง (ไม่รวม lock)
      const [renterRows] = await db.query(
        'SELECT renter_id FROM renter WHERE user_id = ?', [req.user.user_id]
      );
      if (renterRows.length === 0) return res.json({ success: true, data: [] });

      query = `
        SELECT b.booking_id, b.renter_id, b.stall_id, b.staff_id,
               DATE_FORMAT(b.market_date, '%Y-%m-%d') AS market_date,
               b.booking_date, b.booking_status, b.lock_expires_at,
               s.stall_number, s.stall_zone, s.stall_rate,
               p.payment_id, p.payment_amount, p.payment_slipimage, p.payment_status
        FROM bookings b
        JOIN stalls s ON b.stall_id = s.stall_id
        LEFT JOIN payments p ON b.booking_id = p.booking_id
        WHERE b.renter_id = ?
          AND b.booking_status IN ('pending','paid','approved','rejected')
          AND b.lock_expires_at IS NULL
        ORDER BY b.booking_date DESC
      `;
      params = [renterRows[0].renter_id];
    }

    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

// ─── GET /bookings/:id ────────────────────────────────────────────────────────
const getBookingById = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.booking_id, b.renter_id, b.stall_id, b.staff_id,
              DATE_FORMAT(b.market_date, '%Y-%m-%d') AS market_date,
              b.booking_date, b.booking_status,
              s.stall_number, s.stall_zone, s.stall_rate,
              r.renter_shopname, u.user_name
       FROM bookings b
       JOIN stalls s ON b.stall_id  = s.stall_id
       JOIN renter r ON b.renter_id = r.renter_id
       JOIN users u  ON r.user_id   = u.user_id
       WHERE b.booking_id = ?`,
      [req.params.id]
    );
    if (rows.length === 0)
      return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

// ─── PATCH /bookings/:id/status ───────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  const { booking_status } = req.body;
  if (!['approved', 'rejected'].includes(booking_status))
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [staffRows] = await conn.query(
      'SELECT staff_id FROM staff WHERE user_id = ?', [req.user.user_id]
    );
    const staff_id = staffRows[0]?.staff_id || null;

    const [result] = await conn.query(
      'UPDATE bookings SET booking_status = ?, staff_id = ? WHERE booking_id = ?',
      [booking_status, staff_id, req.params.id]
    );
    if (result.affectedRows === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบการจอง' });
    }

    const paymentStatus = booking_status === 'approved' ? 'verified' : 'rejected';
    await conn.query(
      'UPDATE payments SET payment_status = ? WHERE booking_id = ?',
      [paymentStatus, req.params.id]
    );

    await conn.commit();
    res.json({ success: true, message: `${booking_status === 'approved' ? 'อนุมัติ' : 'ปฏิเสธ'}สำเร็จ` });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  } finally { conn.release(); }
};

// ─── DELETE /bookings/:id ─────────────────────────────────────────────────────
const cancelBooking = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [renterRows] = await conn.query(
      'SELECT renter_id FROM renter WHERE user_id = ?', [req.user.user_id]
    );
    if (renterRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้เช่า' });
    }
    const renter_id = renterRows[0].renter_id;

    const [rows] = await conn.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND renter_id = ?',
      [req.params.id, renter_id]
    );
    if (rows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบการจองนี้' });
    }

    if (!['pending', 'paid'].includes(rows[0].booking_status)) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'ไม่สามารถยกเลิกได้ เนื่องจากอนุมัติแล้ว' });
    }

    await conn.query(
      'UPDATE bookings SET booking_status = ? WHERE booking_id = ?',
      ['rejected', req.params.id]
    );
    await conn.query(
      'UPDATE payments SET payment_status = ? WHERE booking_id = ?',
      ['rejected', req.params.id]
    );

    await conn.commit();
    res.json({ success: true, message: 'ยกเลิกการจองสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  } finally { conn.release(); }
};

module.exports = { createBooking, getBookings, getBookingById, updateBookingStatus, cancelBooking };