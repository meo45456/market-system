const db = require('../config/db');

const getNextId = async (table, prefix, idCol) => {
  const [rows] = await db.query(`SELECT ${idCol} FROM ${table} ORDER BY ${idCol} DESC LIMIT 1`);
  if (rows.length === 0) return `${prefix}001`;
  const last = rows[0][idCol];
  const num = parseInt(last.replace(prefix, '')) + 1;
  return `${prefix}${String(num).padStart(3, '0')}`;
};

// สร้างการจอง + แนบสลิปพร้อมกัน
const createBooking = async (req, res) => {
  const { stall_id, market_date, payment_method, payment_amount } = req.body;
  const renter_id = req.user.profile_id;

  if (!stall_id || !market_date) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุแผงและวันที่' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'กรุณาแนบสลิปการโอนเงิน' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // เช็คแผงซ้ำในวันนั้น
    const [conflict] = await conn.query(
      `SELECT booking_id FROM bookings WHERE stall_id = ? AND market_date = ? 
       AND booking_status IN ('pending','approved','paid')`,
      [stall_id, market_date]
    );
    if (conflict.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'แผงนี้ถูกจองในวันดังกล่าวแล้ว' });
    }

    // เช็คผู้เช่าจองซ้ำวันเดียวกัน
    const [myConflict] = await conn.query(
      `SELECT booking_id FROM bookings WHERE renter_id = ? AND market_date = ? 
       AND booking_status IN ('pending','approved','paid')`,
      [renter_id, market_date]
    );
    if (myConflict.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'คุณมีการจองในวันนี้แล้ว' });
    }

    // ดึงข้อมูลแผง
    const [stall] = await conn.query('SELECT * FROM stalls WHERE stall_id = ?', [stall_id]);
    if (stall.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, message: 'ไม่พบแผงนี้' });
    }

    // สร้าง booking สถานะ pending
    const booking_id = await getNextId('bookings', 'b', 'booking_id');
    await conn.query(
      'INSERT INTO bookings (booking_id, stall_id, booking_date, booking_status, renter_id, market_date) VALUES (?, ?, NOW(), ?, ?, ?)',
      [booking_id, stall_id, 'pending', renter_id, market_date]
    );

    // สร้าง payment พร้อมกันเลย
    const payment_id = await getNextId('payments', 'p', 'payment_id');
    await conn.query(
      'INSERT INTO payments (payment_id, payment_date, payment_slipimage, payment_method, payment_amount, booking_id) VALUES (?, NOW(), ?, ?, ?, ?)',
      [payment_id, req.file.filename, payment_method || 'PromptPay', payment_amount || stall[0].stall_rate, booking_id]
    );

    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'ส่งคำขอจองและหลักฐานการชำระเงินสำเร็จ รอเจ้าหน้าที่อนุมัติ',
      booking_id
    });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  } finally {
    conn.release();
  }
};

const getBookings = async (req, res) => {
  const { status, date } = req.query;
  try {
    let query = `
      SELECT b.*, 
        s.stall_number, s.stall_zone, s.stall_rate,
        r.renter_shopname, r.renter_product, r.renter_tel,
        u.user_name,
        p.payment_id, p.payment_amount, p.payment_method, p.payment_slipimage, p.payment_date
      FROM bookings b
      JOIN stalls s ON b.stall_id = s.stall_id
      JOIN renter r ON b.renter_id = r.renter_id
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE 1=1
    `;
    const params = [];
    if (req.user.role === 'renter') {
      query += ' AND b.renter_id = ?';
      params.push(req.user.profile_id);
    }
    if (status) { query += ' AND b.booking_status = ?'; params.push(status); }
    if (date) { query += ' AND b.market_date = ?'; params.push(date); }
    query += ' ORDER BY b.booking_date DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT b.*, 
        s.stall_number, s.stall_zone, s.stall_rate,
        r.renter_shopname, r.renter_product, r.renter_tel, r.renter_id,
        u.user_name,
        p.payment_id, p.payment_amount, p.payment_method, p.payment_slipimage, p.payment_date
      FROM bookings b
      JOIN stalls s ON b.stall_id = s.stall_id
      JOIN renter r ON b.renter_id = r.renter_id
      JOIN users u ON r.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.booking_id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบการจองนี้' });
    const booking = rows[0];
    if (req.user.role === 'renter' && booking.renter_id !== req.user.profile_id) {
      return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ดูการจองนี้' });
    }
    res.json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const updateBookingStatus = async (req, res) => {
  const { booking_status } = req.body;
  const staff_id = req.user.profile_id;
  if (!['approved', 'rejected'].includes(booking_status)) {
    return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
  }
  try {
    const [bookings] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [req.params.id]);
    if (bookings.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบการจองนี้' });

    await db.query(
      'UPDATE bookings SET booking_status = ?, staff_id = ? WHERE booking_id = ?',
      [booking_status, staff_id, req.params.id]
    );

    // ถ้าอนุมัติ → แผงเป็น occupied
    if (booking_status === 'approved') {
      await db.query('UPDATE stalls SET stall_status = ? WHERE stall_id = ?', ['occupied', bookings[0].stall_id]);
    }
    // ถ้าปฏิเสธ → แผงกลับเป็น available
    if (booking_status === 'rejected') {
      await db.query('UPDATE stalls SET stall_status = ? WHERE stall_id = ?', ['available', bookings[0].stall_id]);
    }

    res.json({ success: true, message: `อัปเดตสถานะสำเร็จ` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

module.exports = { createBooking, getBookings, getBookingById, updateBookingStatus };