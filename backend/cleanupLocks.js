const db = require('./config/db')

const cleanupExpiredLocks = async () => {
  try {
    await db.query(
      `UPDATE bookings SET booking_status = 'cancelled'
       WHERE booking_status = 'processing'
         AND lock_expires_at IS NOT NULL
         AND lock_expires_at < NOW()`
    )
    await db.query(
      `UPDATE stalls SET stall_status = 'available'
       WHERE stall_status = 'processing'
         AND stall_id NOT IN (
           SELECT DISTINCT stall_id FROM bookings
           WHERE booking_status IN ('processing','pending','approved','paid')
             AND (lock_expires_at IS NULL OR lock_expires_at > NOW())
         )`
    )
  } catch (err) {
    console.error('Cleanup error:', err.message)
  }
}

setInterval(cleanupExpiredLocks, 2 * 60 * 1000)
cleanupExpiredLocks()
module.exports = cleanupExpiredLocks