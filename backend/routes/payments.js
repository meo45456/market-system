const express = require('express');
const router = express.Router();
const { getPayments, verifyPayment } = require('../controllers/paymentController');
const { authMiddleware, staffOnly } = require('../middleware/auth');

router.get('/',              authMiddleware, getPayments);
router.patch('/:id/verify',  authMiddleware, staffOnly, verifyPayment);

module.exports = router;