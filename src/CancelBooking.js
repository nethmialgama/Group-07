// src/CancelBooking.js
import React, { useState, useEffect, useRef } from "react";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

function CancelBooking({ onNavigate, booking }) {
  const room = booking || null;

  // ── ALL HOOKS FIRST ────────────────────────────────────────────────────────
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [refundQuote, setRefundQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const hasFetched = useRef(false);

  // ── Fetch refund quote from backend ───────────────────────────────────────
  useEffect(() => {
    if (!room?.reservationId || hasFetched.current) return;
    hasFetched.current = true;

    const fetchQuote = async () => {
      setQuoteLoading(true);
      try {
        const res = await fetch(
          `http://localhost:5000/api/payments/refund-quote/${room.reservationId}`,
          { headers: getAuthHeaders() },
        );
        const data = await res.json();
        if (!res.ok)
          throw new Error(data.error || "Failed to load refund info");
        setRefundQuote(data);
      } catch (err) {
        console.error(err);
        showToast("Could not load refund details.", "error");
      } finally {
        setQuoteLoading(false);
      }
    };

    fetchQuote();
  }, []);

  // ── Early return AFTER hooks ───────────────────────────────────────────────
  if (!room || !room.reservationId) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <h2>No booking found</h2>
        <p>Please go to your dashboard and select a booking to cancel.</p>
        <button className="btn-blue" onClick={() => onNavigate("dashboard")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  // ── Handle Cancel ──────────────────────────────────────────────────────────
  const handleCancel = async () => {
    if (!reason) {
      showToast("Please select a reason for cancellation.", "warning");
      return;
    }
    if (reason === "other" && !otherReason.trim()) {
      showToast("Please describe your reason for cancellation.", "warning");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to cancel this booking?\n\n` +
        `${
          refundQuote
            ? refundQuote.refundableAmount > 0
              ? `You will receive a refund of LKR ${refundQuote.refundableAmount.toLocaleString()} (${Math.round(refundQuote.refundableRate * 100)}%).`
              : "You will not receive a refund based on our policy."
            : "Refund will be based on our cancellation policy."
        }\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setCancelling(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/reservations/${room.reservationId}/cancel`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            reason: reason === "other" ? otherReason : reason,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Cancellation failed");

      showToast(
        "Booking cancelled. Refund will be processed shortly.",
        "success",
      );
      onNavigate("dashboard");
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Cancellation failed. Please try again.",
        "error",
      );
    } finally {
      setCancelling(false);
    }
  };

  // ── Refund badge colour ────────────────────────────────────────────────────
  const refundRate = refundQuote
    ? Math.round(refundQuote.refundableRate * 100)
    : null;
  const refundAmount = refundQuote?.refundableAmount || 0;
  const daysLeft = refundQuote?.daysBeforeCheckIn;
  const paidAmount = refundQuote?.paidAmount || 0;

  const badgeColor =
    refundRate === null
      ? "grey"
      : refundRate >= 70
        ? "green"
        : refundRate >= 40
          ? "orange"
          : "red";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="page-container">
      <div className="cancel-header">
        <h1>Cancel Booking</h1>
        <p>Review your refund eligibility before cancelling.</p>
      </div>

      <div className="cancel-content">
        {/* Booking Summary Card */}
        <div className="booking-summary-card">
          {room.image && (
            <div className="summary-image">
              <img src={room.image} alt="Room" />
            </div>
          )}
          <div className="summary-details">
            <h2>{room.title || room.roomType || "Hotel Room"}</h2>
            <div className="summary-grid">
              <p>
                <strong>Check-in:</strong> {room.checkIn || "-"}
              </p>
              <p>
                <strong>Check-out:</strong> {room.checkOut || "-"}
              </p>
              <p>
                <strong>Guests:</strong> {room.guests || "-"}
              </p>
              <p>
                <strong>Total Paid:</strong> LKR{" "}
                {paidAmount > 0
                  ? paidAmount.toLocaleString()
                  : room.totalPaid || room.price || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Refund Estimate Card */}
        <div className="refund-estimate-card">
          <h3>Your Refund Estimate</h3>

          {quoteLoading ? (
            <p className="quote-loading-text">⏳ Calculating your refund...</p>
          ) : refundQuote ? (
            <>
              {/* Days badge */}
              {daysLeft !== null && daysLeft !== undefined && (
                <div
                  className={`days-badge ${daysLeft > 30 ? "green" : daysLeft >= 7 ? "orange" : "red"}`}
                >
                  {daysLeft > 0
                    ? `${daysLeft} days before check-in`
                    : daysLeft === 0
                      ? "Check-in is today"
                      : "Check-in has passed"}
                </div>
              )}

              {/* Refund amount display */}
              <div className="refund-amount-display">
                <div className={`refund-badge-large ${badgeColor}`}>
                  {refundRate > 0 ? `${refundRate}% Refundable` : "No Refund"}
                </div>
                {refundRate > 0 ? (
                  <div className="refund-amount-value">
                    <span>You will receive:</span>
                    <strong>LKR {refundAmount.toLocaleString()}</strong>
                  </div>
                ) : (
                  <p className="no-refund-note">
                    Unfortunately your check-in is less than 3 days away so no
                    refund applies.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p style={{ color: "#888", fontSize: "14px" }}>
              Refund will be calculated based on our cancellation policy.
            </p>
          )}
        </div>

        {/* Refund Policy Table */}
        <div className="refund-section">
          <h3>Cancellation Policy</h3>
          <div className="refund-table">
            {[
              {
                time: "More than 30 days",
                refund: "80% Refund",
                highlight: daysLeft > 30,
              },
              {
                time: "30–20 days",
                refund: "70% Refund",
                highlight: daysLeft >= 20 && daysLeft <= 30,
              },
              {
                time: "20–7 days",
                refund: "60% Refund",
                highlight: daysLeft >= 7 && daysLeft < 20,
              },
              {
                time: "7–3 days",
                refund: "40% Refund",
                highlight: daysLeft >= 3 && daysLeft < 7,
              },
              {
                time: "Less than 3 days",
                refund: "No Refund",
                highlight: daysLeft >= 0 && daysLeft < 3,
              },
            ].map((row) => (
              <div
                key={row.time}
                className={`refund-row ${row.highlight ? "refund-row-active" : ""}`}
              >
                <span>{row.time}</span>
                <span>{row.refund}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reason & Action */}
        <div className="reason-section">
          <label>Reason for Cancellation *</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select a reason...</option>
            <option value="plans">Change of plans</option>
            <option value="price">Found a better price</option>
            <option value="emergency">Personal emergency</option>
            <option value="other">Other</option>
          </select>

          {reason === "other" && (
            <div className="other-reason-container">
              <label className="sub-label">Please specify *</label>
              <textarea
                className="other-reason-box"
                placeholder="Type your reason here..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
              />
            </div>
          )}

          <div className="warning-text">
            ⚠️ Once cancelled, this action cannot be undone.
          </div>

          <button
            className="btn-cancel-danger"
            onClick={handleCancel}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel Booking"}
          </button>
          <button className="btn-keep" onClick={() => onNavigate("dashboard")}>
            Keep My Booking
          </button>
        </div>
      </div>
    </div>
  );
}

export default CancelBooking;
