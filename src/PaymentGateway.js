// src/PaymentGateway.js
import React, { useState } from "react";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

// ─── Test Cards (like Stripe test mode) ───────────────────────────────────────
// 4242 4242 4242 4242  → Success
// 4000 0000 0000 0002  → Card declined
// 4000 0000 0000 9995  → Insufficient funds
// 4000 0000 0000 0069  → Expired card
// 4000 0000 0000 0127  → Incorrect CVV
const TEST_CARDS = {
  4242424242424242: { result: "success" },
  4000000000000002: { result: "declined", message: "Your card was declined." },
  4000000000000069: { result: "expired", message: "Your card has expired." },
  4000000000009995: {
    result: "insufficient",
    message: "Insufficient funds on this card.",
  },
  4000000000000127: {
    result: "cvv",
    message: "Incorrect CVV. Please check your card.",
  },
};

// ─── Luhn Algorithm (real card number validation) ─────────────────────────────
function luhnCheck(cardNumber) {
  const digits = cardNumber.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i]);
    if (shouldDouble) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

// ─── Detect card brand from first digits ──────────────────────────────────────
function detectCardBrand(number) {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return { brand: "Visa", icon: "💳" };
  if (/^5[1-5]/.test(n)) return { brand: "Mastercard", icon: "💳" };
  if (/^3[47]/.test(n)) return { brand: "Amex", icon: "💳" };
  if (/^6(?:011|5)/.test(n)) return { brand: "Discover", icon: "💳" };
  return { brand: "", icon: "💳" };
}

// ─── Format card number with spaces ───────────────────────────────────────────
function formatCardNumber(value) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

// ─── Format expiry MM/YY ──────────────────────────────────────────────────────
function formatExpiry(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

// ─── Main Component ───────────────────────────────────────────────────────────
function PaymentGateway({ onNavigate, room }) {
  const bookingData = room || null;

  if (!bookingData || !bookingData.reservationId) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <h2>Session expired</h2>
        <p>Please start your booking again.</p>
        <button className="btn-blue" onClick={() => onNavigate("rooms")}>
          Browse Rooms
        </button>
      </div>
    );
  }

  const amount = bookingData.amount || 0;
  const billing = bookingData.billing || {};

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState(billing.fullName || "");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const cardBrand = detectCardBrand(cardNumber);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    const rawCard = cardNumber.replace(/\s/g, "");

    if (!cardName.trim()) {
      newErrors.cardName = "Cardholder name is required";
    }
    if (rawCard.length < 16) {
      newErrors.cardNumber = "Enter a valid 16-digit card number";
    } else if (!luhnCheck(rawCard)) {
      newErrors.cardNumber = "Invalid card number";
    }

    const [mm, yy] = (expiry + "/").split("/");
    const month = parseInt(mm);
    const year = 2000 + parseInt(yy || "0");
    const now = new Date();
    if (!mm || !yy || mm.length < 2 || yy.length < 2) {
      newErrors.expiry = "Enter expiry as MM/YY";
    } else if (month < 1 || month > 12) {
      newErrors.expiry = "Invalid month";
    } else if (
      new Date(year, month - 1) < new Date(now.getFullYear(), now.getMonth())
    ) {
      newErrors.expiry = "This card has expired";
    }

    if (cvv.length < 3) {
      newErrors.cvv = "CVV must be 3 digits";
    }

    return newErrors;
  };

  // ── Handle Pay ──────────────────────────────────────────────────────────────
  const handlePay = async () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsProcessing(true);
    setErrors({});

    // Step 1 — Simulated gateway processing animation
    setProcessingStep("Connecting to payment network...");
    await delay(900);
    setProcessingStep("Verifying card details...");
    await delay(900);
    setProcessingStep("Authorizing transaction...");
    await delay(900);

    // Step 2 — Check test card result
    const rawCard = cardNumber.replace(/\s/g, "");
    const testCard = TEST_CARDS[rawCard];

    // If it's a known decline test card
    if (testCard && testCard.result !== "success") {
      setIsProcessing(false);
      setProcessingStep("");
      showToast(testCard.message, "error");
      return;
    }

    // Step 3 — Submit payment to your backend
    try {
      setProcessingStep("Completing payment...");
      const response = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          reservationId: bookingData.reservationId,
          amount: amount,
          payment_method: "Card",
          status: "Completed",
          billing: billing,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Payment failed");
      }

      setProcessingStep("Payment successful! ✓");
      await delay(700);

      // Navigate to confirmation page
      onNavigate("payment-confirmation", {
        ...bookingData,
        paymentId: data.paymentId,
        paidAmount: data.paidAmount,
        remaining: data.remainingAmount,
        cardLast4: rawCard.slice(-4),
        cardBrand: cardBrand.brand,
        status: "Confirmed",
      });
    } catch (err) {
      console.error(err);
      showToast(err.message || "Payment failed. Please try again.", "error");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  // ── Processing Overlay ───────────────────────────────────────────────────────
  if (isProcessing) {
    return (
      <div className="processing-overlay">
        <div className="processing-box">
          <div className="processing-spinner" />
          <p className="processing-step">{processingStep}</p>
          <p className="processing-sub">Please do not close this window</p>
        </div>
      </div>
    );
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      {/* Header */}
      <div className="payment-header">
        <h1>Secure Payment</h1>
        <p>🔒 Your payment is encrypted and secure</p>
      </div>

      {/* Step indicator */}
      <div className="payment-steps">
        <div className="step done">
          <span className="step-number">✓</span>
          <span className="step-label">Review &amp; Billing</span>
        </div>
        <div className="step-line done" />
        <div className="step active">
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
        <div className="step-line" />
        <div className="step">
          <span className="step-number">3</span>
          <span className="step-label">Confirmation</span>
        </div>
      </div>

      <div className="gateway-layout">
        {/* ── LEFT: Card Form ── */}
        <div className="card-form-section">
          {/* Fake secure badge */}
          <div className="secure-badge">
            <span>🔒</span>
            <span>256-bit SSL Encrypted</span>
            <span className="badge-cards">VISA &nbsp; MC &nbsp; AMEX</span>
          </div>

          {/* Visual card preview */}
          <div className="card-preview">
            <div className="card-preview-top">
              <span className="card-chip">▬▬</span>
              <span className="card-brand-label">{cardBrand.brand}</span>
            </div>
            <div className="card-preview-number">
              {cardNumber || "•••• •••• •••• ••••"}
            </div>
            <div className="card-preview-bottom">
              <div>
                <div className="card-preview-label">Card Holder</div>
                <div>{cardName || "YOUR NAME"}</div>
              </div>
              <div>
                <div className="card-preview-label">Expires</div>
                <div>{expiry || "MM/YY"}</div>
              </div>
            </div>
          </div>

          {/* Card inputs */}
          <div className="billing-form" style={{ marginTop: "24px" }}>
            <label>Cardholder Name *</label>
            <input
              type="text"
              placeholder="Name as on card"
              value={cardName}
              onChange={(e) => {
                setCardName(e.target.value);
                setErrors((p) => ({ ...p, cardName: "" }));
              }}
              className={errors.cardName ? "input-error" : ""}
            />
            {errors.cardName && (
              <span className="field-error">{errors.cardName}</span>
            )}

            <label>Card Number *</label>
            <div className="card-number-row">
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                maxLength={19}
                onChange={(e) => {
                  setCardNumber(formatCardNumber(e.target.value));
                  setErrors((p) => ({ ...p, cardNumber: "" }));
                }}
                className={errors.cardNumber ? "input-error" : ""}
                style={{ flex: 1 }}
              />
              <span className="card-brand-icon">{cardBrand.icon}</span>
            </div>
            {errors.cardNumber && (
              <span className="field-error">{errors.cardNumber}</span>
            )}

            <div className="row-inputs">
              <div style={{ flex: 1 }}>
                <label>Expiry Date *</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={expiry}
                  maxLength={5}
                  onChange={(e) => {
                    setExpiry(formatExpiry(e.target.value));
                    setErrors((p) => ({ ...p, expiry: "" }));
                  }}
                  className={errors.expiry ? "input-error" : ""}
                />
                {errors.expiry && (
                  <span className="field-error">{errors.expiry}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label>CVV *</label>
                <input
                  type="password"
                  placeholder="•••"
                  value={cvv}
                  maxLength={4}
                  onChange={(e) => {
                    setCvv(e.target.value.replace(/\D/g, ""));
                    setErrors((p) => ({ ...p, cvv: "" }));
                  }}
                  className={errors.cvv ? "input-error" : ""}
                />
                {errors.cvv && (
                  <span className="field-error">{errors.cvv}</span>
                )}
              </div>
            </div>
          </div>

          {/* Test card hint — remove before final demo if you want */}
          <div className="test-card-hint">
            <strong>Test cards:</strong>
            <br />
            ✅ 4242 4242 4242 4242 — Success
            <br />
            ❌ 4000 0000 0000 0002 — Declined
            <br />
            💸 4000 0000 0000 9995 — Insufficient funds
          </div>
        </div>

        {/* ── RIGHT: Order Summary ── */}
        <div className="payment-details-section">
          <div className="summary-card">
            <h3>Order Summary</h3>

            <div className="summary-row">
              <span>Room</span>
              <strong>{bookingData.title || "Hotel Room"}</strong>
            </div>
            <div className="summary-row">
              <span>Check-in</span>
              <span>{bookingData.checkIn || "-"}</span>
            </div>
            <div className="summary-row">
              <span>Check-out</span>
              <span>{bookingData.checkOut || "-"}</span>
            </div>
            <div className="summary-row">
              <span>Guest</span>
              <span>{billing.fullName || "-"}</span>
            </div>

            <div className="summary-divider" />

            <div className="summary-row total">
              <span>Total</span>
              <strong>LKR {amount.toLocaleString()}</strong>
            </div>
          </div>

          <div className="payment-actions">
            <button className="btn-pay" onClick={handlePay}>
              🔒 Pay LKR {amount.toLocaleString()}
            </button>
            <button
              className="btn-cancel-pay"
              onClick={() => onNavigate("payment", bookingData)}
            >
              ← Back
            </button>
          </div>

          <p
            style={{
              fontSize: "12px",
              color: "#888",
              marginTop: "12px",
              textAlign: "center",
            }}
          >
            By completing this payment you agree to our terms of service. Your
            card details are not stored on our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

// Small helper to create delays for the processing animation
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default PaymentGateway;
