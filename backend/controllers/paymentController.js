const db = require('../config/db');

const getPayments = async (req, res) => {
  try {
    let query, params = [];
    if (req.user.role === 'staff') {
      query = `
        SELECT p.*, b.market_date, b.booking_status,
               s.stall_number, s.stall_zone,
               r.renter_shopname, u.user_name
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN stalls s ON b.stall_id = s.stall_id
        JOIN renter r ON b.renter_id = r.renter_id
        JOIN users u ON r.user_id = u.user_id
        ORDER BY p.payment_date DESC
      `;
    } else {
      const [renterRows] = await db.query('SELECT renter_id FROM renter WHERE user_id = ?', [req.user.user_id]);
      if (renterRows.length === 0) return res.json({ success: true, data: [] });
      query = `
        SELECT p.*, b.market_date, s.stall_number, s.stall_zone
        FROM payments p
        JOIN bookings b ON p.booking_id = b.booking_id
        JOIN stalls s ON b.stall_id = s.stall_id
        WHERE b.renter_id = ?
        ORDER BY p.payment_date DESC
      `;
      params = [renterRows[0].renter_id];
    }
    const [rows] = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const verifyPayment = async (req, res) => {
  const { verified } = req.body
  try {
    const status = verified ? 'verified' : 'rejected'
    const [result] = await db.query(
      'UPDATE payments SET payment_status = ? WHERE payment_id = ?',
      [status, req.params.id]
    )
    if (result.affectedRows === 0)
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลการชำระเงิน' })
    res.json({ success: true, message: 'อัปเดตสถานะสำเร็จ' })
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message })
  }
}

module.exports = { getPayments, verifyPayment }