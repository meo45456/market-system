const db = require('../config/db');

const getMyProfile = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.*, u.user_name FROM renter r JOIN users u ON r.user_id = u.user_id WHERE r.user_id = ?',
      [req.user.user_id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้เช่า' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const updateMyProfile = async (req, res) => {
  const { renter_shopname, renter_zone, renter_tel } = req.body;
  try {
    const [result] = await db.query(
      `UPDATE renter
       SET renter_shopname = COALESCE(?, renter_shopname),
           renter_zone     = COALESCE(?, renter_zone),
           renter_tel      = COALESCE(?, renter_tel)
       WHERE user_id = ?`,
      [renter_shopname, renter_zone, renter_tel, req.user.user_id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้เช่า' });
    res.json({ success: true, message: 'อัปเดตสำเร็จ' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const getAllRenters = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT r.*, u.user_name FROM renter r JOIN users u ON r.user_id = u.user_id ORDER BY r.renter_id'
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

module.exports = { getMyProfile, updateMyProfile, getAllRenters };