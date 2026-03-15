const express = require('express');
const router = express.Router();
const { getMyProfile, updateMyProfile, getAllRenters } = require('../controllers/renterController');
const { authMiddleware, staffOnly, renterOnly } = require('../middleware/auth');

router.get('/me',  authMiddleware, renterOnly, getMyProfile);
router.put('/me',  authMiddleware, renterOnly, updateMyProfile);
router.get('/',    authMiddleware, staffOnly,  getAllRenters);

module.exports = router;