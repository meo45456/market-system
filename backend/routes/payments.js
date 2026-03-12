const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createPayment, verifyPayment, getPayments } = require('../controllers/paymentController');
const { authMiddleware, staffOnly, renterOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'slip-' + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|webp/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true);
  else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/', authMiddleware, renterOnly, upload.single('slip'), createPayment);
router.patch('/:id/verify', authMiddleware, staffOnly, verifyPayment);
router.get('/', authMiddleware, getPayments);

module.exports = router;