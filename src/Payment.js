// src/Payment.js
import React, { useState, useEffect, useRef } from "react";
import { showToast } from "./toast";
import { getStoredAuth, getAuthHeaders } from "./auth";

function Payment({ onNavigate, room }) {
  const storedAuth = getStoredAuth();

  // ── ALL HOOKS FIRST ────────────────────────────────────────────────────────
  const [fullName, setFullName] = useState(storedAuth.name || "");
  const [email, setEmail] = useState(storedAuth.email || "");
  const [phone, setPhone] = useState(storedAuth.phone || "");
  const [address, setAddress] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [errors, setErrors] = useState({});

  // Payment amount state
  const [quote, setQuote] = useState(null); // from backend
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [payAmount, setPayAmount] = useState(0); // what user chose to pay

  const hasFetchedQuote = useRef(false);

  // ── Early return AFTER hooks ───────────────────────────────────────────────
  const selectedRoom = room || null;
  if (!selectedRoom || !selectedRoom.reservationId) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <h2>No booking found</h2>
        <p>Please select a room and complete the booking form first.</p>
        <button className="btn-blue" onClick={() => onNavigate("rooms")}>
          Browse Rooms
        </button>
      </div>
    );
  }

  // ── Fetch payment quote from backend ──────────────────────────────────────
  useEffect(() => {
    if (hasFetchedQuote.current) return;
    hasFetchedQuote.current = true;

    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/payments/policy/${selectedRoom.reservationId}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to load payment info");

        setQuote(data);
        // Default slider to the minimum required amount
        setPayAmount(data.advancePayment.requiredAmount);
      } catch (err) {
        console.error(err);
        showToast("Could not load payment details. Please try again.", "error");
        // Fallback: use raw price from room prop
        const fallback = Number(
          String(
            selectedRoom.totalPrice ||
              selectedRoom.rawPrice ||
              selectedRoom.price ||
              "0",
          ).replace(/[^0-9.]/g, ""),
        );
        setPayAmount(fallback);
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const totalPrice =
    quote?.totalPrice ||
    Number(
      String(selectedRoom.totalPrice || selectedRoom.price || "0").replace(
        /[^0-9.]/g,
        "",
      ),
    );
  const minAmount = quote?.advancePayment?.requiredAmount || totalPrice;
  const partialAllowed = quote ? minAmount < totalPrice : false;
  const daysLeft = quote?.advancePayment?.daysBeforeCheckIn;
  const requiredRate = quote
    ? Math.round(
        (quote.advancePayment.requiredRate || quote.advancePayment.rate || 1) *
          100,
      )
    : 100;

  // ── Slider change ──────────────────────────────────────────────────────────
  const handleSliderChange = (e) => {
    setPayAmount(Number(e.target.value));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!fullName.trim()) newErrors.fullName = "Full name is required";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = "Enter a valid email";
    if (!phone.trim()) newErrors.phone = "Phone number is required";
    if (!address.trim()) newErrors.address = "Billing address is required";
    if (!agreedToPolicy)
      newErrors.policy = "You must agree to the policy to continue";
    return newErrors;
  };

  const handleProceed = () => {
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    onNavigate("payment-gateway", {
      ...selectedRoom,
      billing: { fullName, email, phone, address },
      amount: payAmount,
      totalPrice,
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="payment-header">
        <h1>Checkout</h1>
        <p>Review your booking and enter billing details</p>
      </div>

      {/* Step indicator */}
      <div className="payment-steps">
        <div className="step active">
          <span className="step-number">1</span>
          <span className="step-label">Review &amp; Billing</span>
        </div>
        <div className="step-line" />
        <div className="step">
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
        <div className="step-line" />
        <div className="step">
          <span className="step-number">3</span>
          <span className="step-label">Confirmation</span>
        </div>
      </div>

      <div className="payment-layout">
        {/* ── LEFT: Billing Information ── */}
        <div className="billing-section">
          <h2>Billing Information</h2>
          <div className="billing-form">
            <label>Full Name *</label>
            <input
              type="text"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setErrors((p) => ({ ...p, fullName: "" }));
              }}
              className={errors.fullName ? "input-error" : ""}
            />
            {errors.fullName && (
              <span className="field-error">{errors.fullName}</span>
            )}

            <label>Email Address *</label>
            <input
              type="email"
              placeholder="example@gmail.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((p) => ({ ...p, email: "" }));
              }}
              className={errors.email ? "input-error" : ""}
            />
            {errors.email && (
              <span className="field-error">{errors.email}</span>
            )}

            <label>Phone Number *</label>
            <input
              type="tel"
              placeholder="+94 77 123 4567"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setErrors((p) => ({ ...p, phone: "" }));
              }}
              className={errors.phone ? "input-error" : ""}
            />
            {errors.phone && (
              <span className="field-error">{errors.phone}</span>
            )}

            <label>Billing Address *</label>
            <input
              type="text"
              placeholder="Street address, City"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setErrors((p) => ({ ...p, address: "" }));
              }}
              className={errors.address ? "input-error" : ""}
            />
            {errors.address && (
              <span className="field-error">{errors.address}</span>
            )}
          </div>
        </div>

        {/* ── RIGHT: Booking Summary + Payment Amount ── */}
        <div className="payment-details-section">
          {/* Booking Summary */}
          <div className="summary-card">
            <h3>Booking Summary</h3>
            <div className="summary-row">
              <span>Room</span>
              <strong>{selectedRoom.title || "Hotel Room"}</strong>
            </div>
            <div className="summary-row">
              <span>Check-in</span>
              <span>{selectedRoom.checkIn || "-"}</span>
            </div>
            <div className="summary-row">
              <span>Check-out</span>
              <span>{selectedRoom.checkOut || "-"}</span>
            </div>
            {selectedRoom.guests && (
              <div className="summary-row">
                <span>Guests</span>
                <span>{selectedRoom.guests}</span>
              </div>
            )}
            <div className="summary-divider" />
            <div className="summary-row total">
              <span>Total Booking Fee</span>
              <strong>LKR {totalPrice.toLocaleString()}</strong>
            </div>
          </div>

          {/* Payment Amount Section */}
          {quoteLoading ? (
            <div className="quote-loading">
              ⏳ Calculating payment requirements...
            </div>
          ) : (
            <div className="payment-amount-card">
              <h3>Payment Amount</h3>

              {/* Days info badge */}
              {daysLeft !== null && daysLeft !== undefined && (
                <div
                  className={`days-badge ${daysLeft > 30 ? "green" : daysLeft >= 20 ? "orange" : "red"}`}
                >
                  {daysLeft > 0
                    ? `${daysLeft} days before check-in`
                    : daysLeft === 0
                      ? "Check-in is today"
                      : "Check-in has passed"}
                </div>
              )}

              {partialAllowed ? (
                <>
                  {/* Policy note */}
                  <p className="payment-policy-note">
                    Based on your booking date, you must pay at least{" "}
                    <strong>{requiredRate}%</strong> (LKR{" "}
                    {minAmount.toLocaleString()}) now. You can pay more or the
                    full amount if you prefer. The remaining balance can be
                    settled at the hotel.
                  </p>

                  {/* Amount display */}
                  <div className="pay-amount-display">
                    <span className="pay-amount-value">
                      LKR {payAmount.toLocaleString()}
                    </span>
                    {payAmount < totalPrice && (
                      <span className="pay-amount-remaining">
                        + LKR {(totalPrice - payAmount).toLocaleString()} at
                        hotel
                      </span>
                    )}
                    {payAmount >= totalPrice && (
                      <span className="pay-amount-full">✓ Full payment</span>
                    )}
                  </div>

                  {/* Slider */}
                  <div className="slider-container">
                    <input
                      type="range"
                      min={minAmount}
                      max={totalPrice}
                      step={100}
                      value={payAmount}
                      onChange={handleSliderChange}
                      className="payment-slider"
                    />
                    <div className="slider-labels">
                      <span>Min: LKR {minAmount.toLocaleString()}</span>
                      <span>Full: LKR {totalPrice.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Quick select buttons */}
                  <div className="quick-pay-buttons">
                    <button
                      className={`quick-pay-btn ${payAmount === minAmount ? "active" : ""}`}
                      onClick={() => setPayAmount(minAmount)}
                    >
                      Min ({requiredRate}%)
                    </button>
                    {requiredRate < 75 && (
                      <button
                        className={`quick-pay-btn ${payAmount === Math.round(totalPrice * 0.75) ? "active" : ""}`}
                        onClick={() =>
                          setPayAmount(Math.round(totalPrice * 0.75))
                        }
                      >
                        75%
                      </button>
                    )}
                    <button
                      className={`quick-pay-btn ${payAmount === totalPrice ? "active" : ""}`}
                      onClick={() => setPayAmount(totalPrice)}
                    >
                      Full (100%)
                    </button>
                  </div>
                </>
              ) : (
                /* Full payment required — no slider */
                <>
                  <p className="payment-policy-note">
                    Your check-in is less than 20 days away. Full payment is
                    required at this time.
                  </p>
                  <div className="pay-amount-display">
                    <span className="pay-amount-value">
                      LKR {totalPrice.toLocaleString()}
                    </span>
                    <span className="pay-amount-full">✓ Full payment</span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Policy agreement */}
          <div
            className={`policy-check-box ${errors.policy ? "policy-error" : ""}`}
          >
            <label className="policy-label">
              <input
                type="checkbox"
                checked={agreedToPolicy}
                onChange={(e) => {
                  setAgreedToPolicy(e.target.checked);
                  setErrors((p) => ({ ...p, policy: "" }));
                }}
              />
              <span>
                I have read and agree to the{" "}
                <span
                  className="policy-link"
                  onClick={() =>
                    showToast(
                      "Advance payment: 20% if 30+ days, 50% if 20-30 days, 100% if under 20 days. Refund: 80% if 30+ days, 70% if 20-30 days, 60% if 7-20 days, 40% if 3-7 days, no refund under 3 days.",
                      "info",
                    )
                  }
                >
                  cancellation &amp; refund policy
                </span>
              </span>
            </label>
            {errors.policy && (
              <span className="field-error">{errors.policy}</span>
            )}
          </div>

          {/* Action buttons */}
          <div className="payment-actions">
            <button
              className="btn-pay"
              onClick={handleProceed}
              disabled={!agreedToPolicy || quoteLoading}
              style={{
                opacity: agreedToPolicy ? 1 : 0.5,
                cursor: agreedToPolicy ? "pointer" : "not-allowed",
              }}
            >
              Confirm &amp; Proceed to Payment →
            </button>
            <button
              className="btn-cancel-pay"
              onClick={() => onNavigate("booking")}
            >
              ← Back to Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payment;
