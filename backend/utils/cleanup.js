const pool = require("../db");

async function cleanupExpiredReservations() {
  try {
    // Automatically set status to 'Cancelled' for any Pending reservation older than 15 minutes,
    // EXCEPT those that have a pending bank slip payment uploaded and awaiting admin review.
    await pool.query(
      `UPDATE Reservation r
       SET r.status = 'Cancelled'
       WHERE r.status = 'Pending'
         AND r.booking_date < NOW() - INTERVAL 15 MINUTE
         AND NOT EXISTS (
           SELECT 1 
           FROM Payment p
           WHERE p.reservationId = r.reservationId
             AND p.payment_method = 'Slip'
             AND p.status = 'Pending'
         )`
    );
  } catch (err) {
    console.error("Error cleaning up expired reservations:", err);
  }
}

module.exports = { cleanupExpiredReservations };
