const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { createBooking, getBookings, getBookingById, updateBookingStatus } = require('../controllers/bookingController');
const { authMiddleware, staffOnly, renterOnly } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, './uploads/'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'slip-' + unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// POST จอง + แนบสลิปพร้อมกัน
router.post('/', authMiddleware, renterOnly, upload.single('slip'), createBooking);
router.get('/', authMiddleware, getBookings);
router.get('/:id', authMiddleware, getBookingById);
router.patch('/:id/status', authMiddleware, staffOnly, updateBookingStatus);

module.exports = router;