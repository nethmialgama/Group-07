// src/Payment.js
import React, { useState } from "react";
import { showToast } from "./toast";
import { getStoredAuth } from "./auth";

function Payment({ onNavigate, room }) {
  const storedAuth = getStoredAuth();

  // ── ALL HOOKS FIRST — before any early return ──────────────────────────────
  const [fullName, setFullName] = useState(storedAuth.name || "");
  const [email, setEmail] = useState(storedAuth.email || "");
  const [phone, setPhone] = useState(storedAuth.phone || "");
  const [address, setAddress] = useState("");
  const [agreedToPolicy, setAgreedToPolicy] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Clean the raw price — strip "LKR", commas, spaces so we always get a number
  const rawAmount = Number(
    String(
      selectedRoom.totalPrice ||
        selectedRoom.rawPrice ||
        selectedRoom.price ||
        "0",
    ).replace(/[^0-9.]/g, ""),
  );
  const displayPrice = rawAmount.toLocaleString();

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
      amount: rawAmount,
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

        {/* ── RIGHT: Booking Summary ── */}
        <div className="payment-details-section">
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
              <span>Total Amount</span>
              <strong>LKR {displayPrice}</strong>
            </div>

            <p className="summary-note">
              💡 A minimum advance payment is required based on your check-in
              date. The remaining balance can be settled at the hotel.
            </p>
          </div>

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
                      "Cancellation policy: Full refund 7+ days before check-in, 50% within 3–7 days, no refund under 3 days.",
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
              disabled={!agreedToPolicy}
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
