const db = require('./config/db');

const cleanupExpiredLocks = async () => {
  try {
    await db.query(
      `DELETE FROM bookings
       WHERE booking_status = 'pending'
         AND lock_expires_at IS NOT NULL
         AND lock_expires_at < NOW()
         AND booking_id NOT IN (SELECT booking_id FROM payments)`
    );
  } catch (err) {
    console.error('Cleanup lock error:', err.message);
  }
};

setInterval(cleanupExpiredLocks, 2 * 60 * 1000);
cleanupExpiredLocks();

module.exports = cleanupExpiredLocks;