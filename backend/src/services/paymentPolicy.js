// backend/src/services/paymentPolicy.js

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateOnly(dateInput) {
  const value = new Date(dateInput);
  if (Number.isNaN(value.getTime())) return null;
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getDaysBeforeCheckIn(checkInDate, referenceDate = new Date()) {
  const checkIn = toDateOnly(checkInDate);
  const reference = toDateOnly(referenceDate);
  if (!checkIn || !reference) return null;
  const diff = checkIn.getTime() - reference.getTime();
  return Math.floor(diff / MS_PER_DAY);
}

// ─── Advance Payment Rules ────────────────────────────────────────────────────
// > 30 days  → minimum 20% required
// 20-30 days → minimum 50% required
// < 20 days  → 100% required (full payment, no partial allowed)
function getAdvancePaymentRate(daysBeforeCheckIn) {
  if (daysBeforeCheckIn > 30) return 0.2;
  if (daysBeforeCheckIn >= 20) return 0.5;
  return 1.0;
}

// Returns true if partial payment is allowed (slider should show)
function isPartialPaymentAllowed(daysBeforeCheckIn) {
  return daysBeforeCheckIn > 20;
}

// ─── Refund Rules ─────────────────────────────────────────────────────────────
// > 30 days  → 80% refund
// 20-30 days → 70% refund
// 7-20 days  → 60% refund
// 3-7 days   → 40% refund
// < 3 days   → 0% refund (no refund)
function getRefundRate(daysBeforeCheckIn) {
  if (daysBeforeCheckIn > 30) return 0.8;
  if (daysBeforeCheckIn >= 20) return 0.7;
  if (daysBeforeCheckIn >= 7) return 0.6;
  if (daysBeforeCheckIn >= 3) return 0.4;
  return 0;
}

// ─── Quotes ───────────────────────────────────────────────────────────────────
function getAdvancePaymentQuote(
  totalPrice,
  checkInDate,
  referenceDate = new Date(),
) {
  const total = Number(totalPrice || 0);
  const daysBeforeCheckIn = getDaysBeforeCheckIn(checkInDate, referenceDate);
  const rate = getAdvancePaymentRate(
    daysBeforeCheckIn == null ? 0 : daysBeforeCheckIn,
  );
  const requiredAmount = roundMoney(total * rate);
  const partialAllowed = isPartialPaymentAllowed(
    daysBeforeCheckIn == null ? 0 : daysBeforeCheckIn,
  );

  return {
    daysBeforeCheckIn,
    rate,
    requiredAmount,
    partialAllowed, // ← frontend uses this to show/hide slider
    totalPrice: total,
  };
}

function getRefundQuote(
  paidAmount,
  checkInDate,
  cancellationDate = new Date(),
) {
  const paid = Number(paidAmount || 0);
  const daysBeforeCheckIn = getDaysBeforeCheckIn(checkInDate, cancellationDate);
  const rate = getRefundRate(daysBeforeCheckIn == null ? 0 : daysBeforeCheckIn);
  const refundAmount = roundMoney(paid * rate);

  return {
    daysBeforeCheckIn,
    rate,
    refundAmount,
  };
}

// ─── Policy Table (for display in UI) ────────────────────────────────────────
function getPolicyTable() {
  return {
    advancePayment: [
      {
        timeBeforeCheckIn: "More than 30 days",
        required: "20%",
        partialAllowed: true,
      },
      {
        timeBeforeCheckIn: "30–20 days",
        required: "50%",
        partialAllowed: true,
      },
      {
        timeBeforeCheckIn: "Less than 20 days",
        required: "100%",
        partialAllowed: false,
      },
    ],
    refundOnCancellation: [
      { timeBeforeCheckIn: "More than 30 days", refundable: "80%" },
      { timeBeforeCheckIn: "30–20 days", refundable: "70%" },
      { timeBeforeCheckIn: "20–7 days", refundable: "60%" },
      { timeBeforeCheckIn: "7–3 days", refundable: "40%" },
      { timeBeforeCheckIn: "Less than 3 days", refundable: "No refund" },
    ],
  };
}

module.exports = {
  getDaysBeforeCheckIn,
  getAdvancePaymentRate,
  getRefundRate,
  getAdvancePaymentQuote,
  getRefundQuote,
  getPolicyTable,
  roundMoney,
  isPartialPaymentAllowed,
};
