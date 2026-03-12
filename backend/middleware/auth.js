const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'ไม่มี Token กรุณาเข้าสู่ระบบ' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
  }
};

const staffOnly = (req, res, next) => {
  if (req.user.role !== 'staff') {
    return res.status(403).json({ success: false, message: 'สิทธิ์เฉพาะเจ้าหน้าที่เท่านั้น' });
  }
  next();
};

const renterOnly = (req, res, next) => {
  if (req.user.role !== 'renter') {
    return res.status(403).json({ success: false, message: 'สิทธิ์เฉพาะผู้เช่าเท่านั้น' });
  }
  next();
};

module.exports = { authMiddleware, staffOnly, renterOnly };