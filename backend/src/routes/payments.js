const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../middleware/auth");

// POST /api/payments - create a payment record
router.post("/", authenticate, async (req, res) => {
  const { reservationId, amount, payment_method, status } = req.body;
  if (!reservationId || !amount || !payment_method) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    if (req.user.userType === "guest") {
      const [rows] = await pool.query(
        "SELECT guestId FROM Reservation WHERE reservationId = ?",
        [reservationId],
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      if (Number(rows[0].guestId) !== Number(req.user.id)) {
        return res
          .status(403)
          .json({ error: "You can only pay for your own reservation" });
      }
    }

    const [result] = await pool.query(
      "INSERT INTO Payment (amount, date, payment_method, status, reservationId) VALUES (?, NOW(), ?, ?, ?)",
      [amount, payment_method, status || "Completed", reservationId],
    );

    // Optionally update reservation status if payment completed
    if ((status || "Completed") === "Completed") {
      await pool.query(
        "UPDATE Reservation SET status = ? WHERE reservationId = ?",
        ["Confirmed", reservationId],
      );
    }

    res.status(201).json({ paymentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
