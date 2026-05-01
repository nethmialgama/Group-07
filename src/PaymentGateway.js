import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ── Inner checkout form ──────────────────────────────────────────────────────
function CheckoutForm({ onNavigate, bookingData }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const amount = bookingData?.amount || 0;
  const billing = bookingData?.billing || {};

  const handlePay = async () => {
    if (!stripe || !elements) {
      showToast("Payment not ready. Please wait.", "error");
      return;
    }

    // Make sure elements are ready before confirming
    const { error: submitError } = await elements.submit();
    if (submitError) {
      showToast(submitError.message, "error");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Verifying card details...");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      showToast(error.message, "error");
      setIsProcessing(false);
      setProcessingStep("");
      return;
    }

    if (paymentIntent && paymentIntent.status === "succeeded") {
      setProcessingStep("Recording payment...");
      try {
        const response = await fetch("http://localhost:5000/api/payments", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            reservationId: bookingData.reservationId,
            amount: amount,
            payment_method: "Card",
            status: "Completed",
            billing: billing,
          }),
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Payment failed");

        setProcessingStep("Payment successful! ✓");
        setTimeout(() => {
          onNavigate("payment-confirmation", {
            ...bookingData,
            paymentId: data.paymentId,
            paidAmount: data.paidAmount,
            remaining: data.remainingAmount,
            cardBrand: "Card",
            status: "Confirmed",
          });
        }, 700);
      } catch (err) {
        showToast(err.message, "error");
        setIsProcessing(false);
        setProcessingStep("");
      }
    }
  };

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

  return (
    <div className="gateway-layout">
      <div className="card-form-section">
        <div className="secure-badge">
          <span>🔒</span>
          <span>256-bit SSL Encrypted</span>
        </div>
        <PaymentElement />
        <div className="payment-actions" style={{ marginTop: "24px" }}>
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
      </div>

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
      </div>
    </div>
  );
}

// ── Main wrapper ─────────────────────────────────────────────────────────────
function PaymentGateway({ onNavigate, room }) {
  const bookingData = room || null;
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    if (!bookingData?.amount) return;

    fetch("http://localhost:5000/api/payments/create-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({ amount: bookingData.amount }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
        else showToast("Failed to initialize payment", "error");
      })
      .catch(() => showToast("Failed to connect to payment server", "error"));
  }, []);

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

  if (!clientSecret) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <p>⏳ Initializing payment...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="payment-header">
        <h1>Secure Payment</h1>
        <p>🔒 Your payment is encrypted and secure</p>
      </div>

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

      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm onNavigate={onNavigate} bookingData={bookingData} />
      </Elements>
    </div>
  );
}

export default PaymentGateway;
