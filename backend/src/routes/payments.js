const express = require("express");
const router = express.Router();
const pool = require("../db");
const { authenticate } = require("../middleware/auth");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const fs = require("fs");
const path = require("path");
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

let paymentSlipColumnsEnsured = false;
async function ensurePaymentSlipColumns() {
  if (paymentSlipColumnsEnsured) return;
  try {
    const [columns] = await pool.query("SHOW COLUMNS FROM Payment LIKE 'slip_image'");
    if (columns.length === 0) {
      await pool.query("ALTER TABLE Payment ADD COLUMN slip_image VARCHAR(255) NULL AFTER reservationId");
      console.log("Migration: Added slip_image column to Payment table.");
    }
    paymentSlipColumnsEnsured = true;
  } catch (err) {
    console.error("Migration: Failed to add slip_image column to Payment table", err);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getReservationById(reservationId) {
  const [rows] = await pool.query(
    "SELECT reservationId, guestId, checkIn, total_price, status FROM Reservation WHERE reservationId = ?",
    [reservationId],
  );
  return rows.length ? rows[0] : null;
}

function canAccessReservation(req, reservation) {
  if (req.user.userType !== "guest") return true;
  return Number(reservation.guestId) === Number(req.user.id);
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// ── POST /api/payments/create-intent ─────────────────────────────────────────
router.post("/create-intent", authenticate, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe uses cents
      currency: "lkr",
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create payment intent" });
  }
});

// ── GET /api/payments/policy-rules ───────────────────────────────────────────
router.get("/policy-rules", (req, res) => {
  res.json(getPolicyTable());
});

// ── GET /api/payments/policy/:reservationId ──────────────────────────────────
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

// ── GET /api/payments/refund-quote/:reservationId ────────────────────────────
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

// ── POST /api/payments ───────────────────────────────────────────────────────
router.post("/", authenticate, async (req, res) => {
  await ensurePaymentSlipColumns();

  const { reservationId, amount, payment_method, status, slip_image } = req.body;
  if (!reservationId || amount == null || !payment_method) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const reservation = await getReservationById(reservationId);
    if (!reservation) {
      return res.status(404).json({ error: "Reservation not found" });
    }
    if (reservation.status === "Cancelled") {
      return res
        .status(400)
        .json({ error: "Your booking session has expired. Please book again." });
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

    // If Bank Slip payment, verify they are paying the full amount
    if (payment_method === "Slip") {
      if (numericAmount + 0.01 < totalPrice) {
        return res.status(400).json({
          error: "Bank Slip upload requires paying the full amount.",
        });
      }
    } else {
      // Otherwise enforce advance policy rules for other types (e.g. Card)
      const advance = getAdvancePaymentQuote(totalPrice, reservation.checkIn);
      if (numericAmount + 0.0001 < advance.requiredAmount) {
        return res.status(400).json({
          error: "Insufficient advance payment for this booking window",
          requiredAdvanceAmount: advance.requiredAmount,
          requiredAdvanceRate: advance.rate,
          daysBeforeCheckIn: advance.daysBeforeCheckIn,
        });
      }
    }

    // Default status: Pending for Bank Slips, Completed for Cards
    const defaultStatus = payment_method === "Slip" ? "Pending" : "Completed";
    const finalStatus = status || defaultStatus;

    // Handle base64 slip upload
    let slipImageFilename = null;
    if (payment_method === "Slip" && slip_image) {
      try {
        const uploadsDir = path.join(__dirname, "../../uploads");
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const matches = slip_image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const imageBuffer = Buffer.from(matches[2], "base64");
          const fileExtension = matches[1].split("/")[1] || "png";
          const filename = `slip-${reservationId}-${Date.now()}.${fileExtension}`;
          fs.writeFileSync(path.join(uploadsDir, filename), imageBuffer);
          slipImageFilename = filename;
        }
      } catch (err) {
        console.error("Failed to save bank slip upload:", err);
      }
    }

    const [result] = await pool.query(
      "INSERT INTO Payment (amount, date, payment_method, status, reservationId, slip_image) VALUES (?, NOW(), ?, ?, ?, ?)",
      [
        roundMoney(numericAmount),
        payment_method,
        finalStatus,
        reservationId,
        slipImageFilename,
      ],
    );

    // Only update reservation status if payment is completed
    if (finalStatus === "Completed") {
      const remainingAmount = totalPrice - numericAmount;
      const nextReservationStatus =
        remainingAmount <= 0.01 ? "Confirmed" : "PartiallyPaid";
      await pool.query(
        "UPDATE Reservation SET status = ? WHERE reservationId = ?",
        [nextReservationStatus, reservationId],
      );
    }

    const advance = getAdvancePaymentQuote(totalPrice, reservation.checkIn);
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

// ── POST /api/payments/send-invoice ──────────────────────────────────────────
router.post("/send-invoice", authenticate, async (req, res) => {
  const { paymentId } = req.body;
  if (!paymentId) return res.status(400).json({ error: "paymentId required" });

  try {
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

// ── GET /api/payments/invoice-pdf/:paymentId ─────────────────────────────────
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
