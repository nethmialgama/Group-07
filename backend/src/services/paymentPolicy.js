const MS_PER_DAY = 24 * 60 * 60 * 1000;

function toDateOnly(dateInput) {
  const value = new Date(dateInput);
  if (Number.isNaN(value.getTime())) {
    return null;
  }
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function roundMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

function getDaysBeforeCheckIn(checkInDate, referenceDate = new Date()) {
  const checkIn = toDateOnly(checkInDate);
  const reference = toDateOnly(referenceDate);

  if (!checkIn || !reference) {
    return null;
  }

  const diff = checkIn.getTime() - reference.getTime();
  return Math.floor(diff / MS_PER_DAY);
}

function getAdvancePaymentRate(daysBeforeCheckIn) {
  if (daysBeforeCheckIn > 30) return 0.2;
  if (daysBeforeCheckIn >= 20) return 0.5;
  return 1;
}

function getRefundRate(daysBeforeCheckIn) {
  if (daysBeforeCheckIn > 30) return 1;
  if (daysBeforeCheckIn >= 20) return 0.8;
  if (daysBeforeCheckIn >= 7) return 0.7;
  if (daysBeforeCheckIn >= 3) return 0.6;
  if (daysBeforeCheckIn >= 1) return 0.4;
  return 0;
}

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

  return {
    daysBeforeCheckIn,
    rate,
    requiredAmount,
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

function getPolicyTable() {
  return {
    advancePayment: [
      { timeBeforeCheckIn: "> 30 days", required: "20%" },
      { timeBeforeCheckIn: "30-20 days", required: "50%" },
      { timeBeforeCheckIn: "< 20 days", required: "100%" },
    ],
    refundOnCancellation: [
      { timeBeforeCheckIn: "> 30 days", refundable: "100%" },
      { timeBeforeCheckIn: "30-20 days", refundable: "80%" },
      { timeBeforeCheckIn: "20-7 days", refundable: "70%" },
      { timeBeforeCheckIn: "7-3 days", refundable: "60%" },
      { timeBeforeCheckIn: "3-1 days", refundable: "40%" },
      { timeBeforeCheckIn: "< 1 day", refundable: "0%" },
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
};
