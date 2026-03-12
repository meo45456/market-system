const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const getNextId = async (table, prefix, idCol) => {
  const [rows] = await db.query(`SELECT ${idCol} FROM ${table} ORDER BY ${idCol} DESC LIMIT 1`);
  if (rows.length === 0) return `${prefix}001`;
  const last = rows[0][idCol];
  const num = parseInt(last.replace(prefix, '')) + 1;
  return `${prefix}${String(num).padStart(3, '0')}`;
};

const register = async (req, res) => {
  const { user_name, user_password, user_role, renter_shopname, renter_zone, renter_citizenid, renter_tel, staff_name, staff_tel } = req.body;

  if (!user_name || !user_password || !user_role) {
    return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบ' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [exist] = await conn.query('SELECT user_id FROM users WHERE user_name = ?', [user_name]);
    if (exist.length > 0) {
      await conn.rollback();
      return res.status(409).json({ success: false, message: 'Username นี้ถูกใช้แล้ว' });
    }

    const hashed = await bcrypt.hash(user_password, 10);
    const user_id = await getNextId('users', 'u', 'user_id');

    await conn.query(
      'INSERT INTO users (user_id, user_name, user_password, user_role) VALUES (?, ?, ?, ?)',
      [user_id, user_name, hashed, user_role]
    );

    if (user_role === 'renter') {
      const renter_id = await getNextId('renter', 'r', 'renter_id');
      await conn.query(
        'INSERT INTO renter (renter_id, user_id, renter_shopname, renter_zone, renter_citizenid, renter_tel) VALUES (?, ?, ?, ?, ?, ?)',
        [renter_id, user_id, renter_shopname || '', renter_zone || null, renter_citizenid, renter_tel]
      );
    } else if (user_role === 'staff') {
      const staff_id = await getNextId('staff', 's', 'staff_id');
      await conn.query(
        'INSERT INTO staff (staff_id, user_id, staff_name, staff_tel) VALUES (?, ?, ?, ?)',
        [staff_id, user_id, staff_name || '', staff_tel || '']
      );
    }

    await conn.commit();
    res.status(201).json({ success: true, message: 'ลงทะเบียนสำเร็จ' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด: ' + err.message });
  } finally {
    conn.release();
  }
};

const login = async (req, res) => {
  const { user_name, user_password } = req.body;

  if (!user_name || !user_password) {
    return res.status(400).json({ success: false, message: 'กรุณากรอก Username และ Password' });
  }

  try {
    const [users] = await db.query('SELECT * FROM users WHERE user_name = ?', [user_name]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
    }

    const user = users[0];
    const valid = await bcrypt.compare(user_password, user.user_password);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Username หรือ Password ไม่ถูกต้อง' });
    }

    let profile = null;
    if (user.user_role === 'renter') {
      const [rows] = await db.query('SELECT * FROM renter WHERE user_id = ?', [user.user_id]);
      profile = rows[0] || null;
    } else {
      const [rows] = await db.query('SELECT * FROM staff WHERE user_id = ?', [user.user_id]);
      profile = rows[0] || null;
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.user_role, profile_id: profile ? (profile.renter_id || profile.staff_id) : null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true, message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: { user_id: user.user_id, user_name: user.user_name, user_role: user.user_role, profile }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

const getMe = async (req, res) => {
  try {
    const [users] = await db.query('SELECT user_id, user_name, user_role FROM users WHERE user_id = ?', [req.user.user_id]);
    if (users.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });

    const user = users[0];
    let profile = null;
    if (user.user_role === 'renter') {
      const [rows] = await db.query('SELECT * FROM renter WHERE user_id = ?', [user.user_id]);
      profile = rows[0] || null;
    } else {
      const [rows] = await db.query('SELECT * FROM staff WHERE user_id = ?', [user.user_id]);
      profile = rows[0] || null;
    }

    res.json({ success: true, user: { ...user, profile } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' });
  }
};

module.exports = { register, login, getMe };