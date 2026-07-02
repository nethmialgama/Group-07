const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const {
  buildInvoicePDF,
  sendInvoiceEmail,
} = require("../services/invoiceService");
const {
  getAdvancePaymentQuote,
  getRefundQuote,
  getPolicyTable,
  roundMoney,
} = require("../services/paymentPolicy");

async function getReservationById(reservationId) {
  const [rows] = await pool.query(
    "SELECT reservationId, guestId, checkIn, total_price FROM Reservation WHERE reservationId = ?",
    [reservationId],
  );
  return rows.length ? rows[0] : null;
}

function canAccessReservation(req, reservation) {
  if (req.user.userType !== "guest") {
    return true;
  }
  return Number(reservation.guestId) === Number(req.user.id);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// GET /api/payments/policy-rules
router.get("/policy-rules", (req, res) => {
  res.json(getPolicyTable());
});

// GET /api/payments/policy/:reservationId
router.get("/policy/:reservationId", authenticate, async (req, res) => {
  try {
    const reservation = await getReservationById(req.params.reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (!canAccessReservation(req, reservation)) {
      return res
        .status(403)
        .json({ error: "You can only access your own reservation" });
    }

    const [paymentRows] = await pool.query(
      "SELECT amount FROM Payment WHERE reservationId = ? LIMIT 1",
      [reservation.reservationId],
    );
    const paidAmount = Number(paymentRows[0]?.amount || 0);

    const totalPrice = Number(reservation.total_price || 0);
    const advance = getAdvancePaymentQuote(totalPrice, reservation.checkIn);
    const refund = getRefundQuote(paidAmount, reservation.checkIn);

    return res.json({
      reservationId: reservation.reservationId,
      checkIn: reservation.checkIn,
      totalPrice,
      paidAmount,
      advancePayment: {
        daysBeforeCheckIn: advance.daysBeforeCheckIn,
        requiredRate: advance.rate,
        requiredAmount: advance.requiredAmount,
      },
      refundIfCancelledNow: {
        daysBeforeCheckIn: refund.daysBeforeCheckIn,
        refundableRate: refund.rate,
        refundableAmount: refund.refundAmount,
      },
      policyTable: getPolicyTable(),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

// GET /api/payments/refund-quote/:reservationId?cancellationDate=YYYY-MM-DD
router.get("/refund-quote/:reservationId", authenticate, async (req, res) => {
  try {
    const reservation = await getReservationById(req.params.reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }

    if (!canAccessReservation(req, reservation)) {
      return res
        .status(403)
        .json({ error: "You can only access your own reservation" });
    }

    const [paymentRows] = await pool.query(
      "SELECT amount FROM Payment WHERE reservationId = ? LIMIT 1",
      [reservation.reservationId],
    );
    const paidAmount = Number(paymentRows[0]?.amount || 0);

    const cancellationDate = req.query.cancellationDate || new Date();
    const quote = getRefundQuote(
      paidAmount,
      reservation.checkIn,
      cancellationDate,
    );

    return res.json({
      reservationId: reservation.reservationId,
      checkIn: reservation.checkIn,
      cancellationDate,
      paidAmount,
      daysBeforeCheckIn: quote.daysBeforeCheckIn,
      refundableRate: quote.rate,
      refundableAmount: quote.refundAmount,
      policyTable: getPolicyTable().refundOnCancellation,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Database error" });
  }
});

// POST /api/payments - create a payment record
router.post("/", authenticate, async (req, res) => {
  const { reservationId, amount, payment_method, status } = req.body;
  if (!reservationId || amount == null || !payment_method) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const reservation = await getReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    if (!canAccessReservation(req, reservation)) {
      return res
        .status(403)
        .json({ error: "You can only pay for your own reservation" });
    }

    const numericAmount = toNumber(amount);
    if (numericAmount == null || numericAmount <= 0) {
      return res
        .status(400)
        .json({ error: "Amount must be a valid positive number" });
    }

    const totalPrice = Number(reservation.total_price || 0);
    const advance = getAdvancePaymentQuote(totalPrice, reservation.checkIn);

    if (numericAmount + 0.0001 < advance.requiredAmount) {
      return res.status(400).json({
        error: "Insufficient advance payment for this booking window",
        requiredAdvanceAmount: advance.requiredAmount,
        requiredAdvanceRate: advance.rate,
        daysBeforeCheckIn: advance.daysBeforeCheckIn,
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Payment (amount, date, payment_method, status, reservationId) VALUES (?, NOW(), ?, ?, ?)",
      [
        roundMoney(numericAmount),
        payment_method,
        status || "Completed",
        reservationId,
      ],
    );

    // Optionally update reservation status if payment completed
    if ((status || "Completed") === "Completed") {
      const nextReservationStatus =
        numericAmount >= totalPrice ? "Confirmed" : "Pending";
      await pool.query(
        "UPDATE Reservation SET status = ? WHERE reservationId = ?",
        [nextReservationStatus, reservationId],
      );
    }

    res.status(201).json({
      paymentId: result.insertId,
      requiredAdvanceAmount: advance.requiredAmount,
      requiredAdvanceRate: advance.rate,
      paidAmount: roundMoney(numericAmount),
      remainingAmount: roundMoney(Math.max(0, totalPrice - numericAmount)),
    });
  } catch (err) {
    console.error(err);
    if (err && err.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ error: "Payment already exists for this reservation" });
    }
    res.status(500).json({ error: "Database error" });
  }
});

// POST /api/payments/send-invoice
router.post("/send-invoice", authenticate, async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: "paymentId required" });

  try {
    // Load payment + reservation + guest from DB
    const [rows] = await pool.query(
      `SELECT p.paymentId, p.amount, p.payment_method,
              r.reservationId, r.checkIn, r.checkOut, r.total_price,
              rm.roomType,
              g.name, g.email, g.phone
       FROM Payment p
       JOIN Reservation r  ON r.reservationId = p.reservationId
       JOIN Room rm         ON rm.roomId       = r.roomId
       JOIN Guest g         ON g.guestId       = r.guestId
       WHERE p.paymentId = ?`,
      [paymentId],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Payment not found" });
    const row = rows[0];

    // Build invoice object (matches what the frontend passes too)
    const invoice = {
      paymentId: row.paymentId,
      paidAmount: Number(row.amount),
      remaining: Math.max(0, Number(row.total_price) - Number(row.amount)),
      title: `${row.roomType} Room`,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      cardBrand: req.body.cardBrand || "",
      cardLast4: req.body.cardLast4 || "",
      billing: {
        fullName: req.body.billing?.fullName || row.name,
        email: req.body.billing?.email || row.email,
        phone: req.body.billing?.phone || row.phone,
        address: req.body.billing?.address || "",
      },
    };

    await sendInvoiceEmail(invoice);
    res.json({ success: true });
  } catch (err) {
    console.error("Invoice email error:", err);
    res.status(500).json({ error: "Failed to send invoice email" });
  }
});

// GET /api/payments/invoice-pdf/:paymentId
router.get("/invoice-pdf/:paymentId", authenticate, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.paymentId, p.amount,
              r.checkIn, r.checkOut, r.total_price,
              rm.roomType,
              g.name, g.email, g.phone
       FROM Payment p
       JOIN Reservation r  ON r.reservationId = p.reservationId
       JOIN Room rm         ON rm.roomId       = r.roomId
       JOIN Guest g         ON g.guestId       = r.guestId
       WHERE p.paymentId = ?`,
      [req.params.paymentId],
    );

    if (!rows.length)
      return res.status(404).json({ error: "Payment not found" });
    const row = rows[0];

    const invoice = {
      paymentId: row.paymentId,
      paidAmount: Number(row.amount),
      remaining: Math.max(0, Number(row.total_price) - Number(row.amount)),
      title: `${row.roomType} Room`,
      checkIn: row.checkIn,
      checkOut: row.checkOut,
      cardBrand: "",
      cardLast4: "",
      billing: {
        fullName: row.name,
        email: row.email,
        phone: row.phone,
        address: "",
      },
    };

    const pdfBuffer = await buildInvoicePDF(invoice);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="SmartHotel-Invoice-${row.paymentId}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

module.exports = router;
