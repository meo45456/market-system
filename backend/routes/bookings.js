const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { createBooking, getBookings, getBookingById, updateBookingStatus, cancelBooking } = require('../controllers/bookingController');
const { authMiddleware, staffOnly, renterOnly } = require('../middleware/auth');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'market-slips',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype))
      cb(null, true);
    else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพ'));
  }
});

router.post('/',             authMiddleware, renterOnly, upload.single('slip'), createBooking);
router.get('/',              authMiddleware, getBookings);
router.get('/:id',           authMiddleware, getBookingById);
router.patch('/:id/status',  authMiddleware, staffOnly,  updateBookingStatus);
router.delete('/:id',        authMiddleware, renterOnly, cancelBooking);

module.exports = router;