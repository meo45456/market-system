const express = require('express');
const router = express.Router();
const { getAllStalls, getStallById, getZones, updateStall, lockStall, unlockStall } = require('../controllers/stallController');
const { authMiddleware, staffOnly } = require('../middleware/auth');

router.get('/zones',       authMiddleware, getZones);
router.get('/',            authMiddleware, getAllStalls);
router.get('/:id',         authMiddleware, getStallById);
router.put('/:id',         authMiddleware, staffOnly, updateStall);
router.post('/:id/lock',   authMiddleware, lockStall);
router.delete('/:id/lock', authMiddleware, unlockStall);

module.exports = router;