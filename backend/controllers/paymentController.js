const db = require('../config/db');

const getNextId = async (table, prefix, idCol) => {
  const [rows] = await db.query(`SELECT ${idCol} FROM ${table} ORDER BY ${idCol} DESC LIMIT 1`);
  if (rows.length === 0) return `${prefix}001`;
  const last = rows[0][idCol];
  const num = parseInt(last.replace(prefix, '')) + 1;
  return `${prefix}${String(num).padStart(3, '0')}`;
};

const createPayment = async (req, res) => {
  const { booking_id, payment_method, payment_amount } = req.body;
  const renter_id = req.user.profile_id;

  if (!booking_id || !payment_method || !payment_amount) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'กรุณาอัปโหลดสลิปการโอนเงิน' });
  }

  try {
    const [bookings] = await db.query(
      'SELECT * FROM bookings WHERE booking_id = ? AND renter_id = ?',
      [booking_id, renter_id]
    );
    if (bookings.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบการจองนี้' });

    const booking = bookings[0];
    if (booking.booking_status !== 'approved') {
      return res.status(400).json({ success: false, message: 'การจองต้องได้รับการอนุมัติก่อนชำระเงิน' });
    }

    const [existPay] = await db.query('SELECT payment_id FROM payments WHERE booking_id = ?', [booking_id]);
    if (existPay.length > 0) {
      return res.status(409).json({ success: false, message: 'ชำระเงินสำหรับการจองนี้แล้ว' });
    }

    const payment_id = await getNextId('payments', 'p', 'payment_id');
    await db.query(
      'INSERT INTO payments (payment_id, payment_date, payment_slipimage, payment_method, payment_amount, booking_id) VALUES (?, NOW(), ?, ?, ?, ?)',
      [payment_id, req.file.filename, payment_method, payment_amount, booking_id]
    );

    await db.query('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', ['paid', booking_id]);

    res.status(201).json({ success: true, message: 'ส่งหลักฐานการชำระเงินสำเร็จ รอเจ้าหน้าที่ตรวจสอบ', payment_id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const verifyPayment = async (req, res) => {
  const { verified } = req.body;
  try {
    const [payments] = await db.query(
      'SELECT p.*, b.stall_id FROM payments p JOIN bookings b ON p.booking_id = b.booking_id WHERE p.payment_id = ?',
      [req.params.id]
    );
    if (payments.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการชำระเงิน' });

    const payment = payments[0];
    if (verified) {
      await db.query('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', ['approved', payment.booking_id]);
      await db.query('UPDATE stalls SET stall_status = ? WHERE stall_id = ?', ['occupied', payment.stall_id]);
      res.json({ success: true, message: 'ยืนยันการชำระเงินสำเร็จ' });
    } else {
      await db.query('UPDATE bookings SET booking_status = ? WHERE booking_id = ?', ['approved', payment.booking_id]);
      await db.query('DELETE FROM payments WHERE payment_id = ?', [req.params.id]);
      res.json({ success: true, message: 'ปฏิเสธการชำระเงิน ผู้เช่าต้องอัปโหลดสลิปใหม่' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const getPayments = async (req, res) => {
  try {
    let query = `
      SELECT p.*, b.market_date, b.booking_status,
        s.stall_number, s.stall_zone,
        r.renter_shopname, r.renter_tel,
        u.user_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN stalls s ON b.stall_id = s.stall_id
      JOIN renter r ON b.renter_id = r.renter_id
      JOIN users u ON r.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    if (req.user.role === 'renter') {
      query += ' AND b.renter_id = ?';
      params.push(req.user.profile_id);
    }
    query += ' ORDER BY p.payment_date DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

module.exports = { createPayment, verifyPayment, getPayments };