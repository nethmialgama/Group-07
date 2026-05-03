import React, { useState, useEffect, useRef } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import ReCAPTCHA from "react-google-recaptcha";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

// ── Checkout Form ────────────────────────────────────────────────────────────
function CheckoutForm({ onNavigate, bookingData }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [isElementReady, setIsElementReady] = useState(false);

  const amount = bookingData?.amount || 0;
  const billing = bookingData?.billing || {};

  const handlePay = async () => {
    if (!stripe || !elements || !isElementReady) {
      showToast("Payment is not ready yet. Please wait a moment.", "error");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Verifying card details...");

    try {
      // Submit the form first to validate fields
      const { error: submitError } = await elements.submit();
      if (submitError) {
        showToast(submitError.message, "error");
        setIsProcessing(false);
        return;
      }

      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        showToast(error.message || "Payment failed", "error");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        setProcessingStep("Recording payment...");

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
        if (!response.ok)
          throw new Error(data.error || "Failed to record payment");

        setProcessingStep("Payment successful! ✓");

        setTimeout(() => {
          onNavigate("payment-confirmation", {
            ...bookingData,
            paymentId: data.paymentId,
            paidAmount: data.paidAmount || amount,
            remaining: data.remainingAmount || 0,
            cardBrand:
              paymentIntent.payment_method_details?.card?.brand || "Card",
            cardLast4: paymentIntent.payment_method_details?.card?.last4 || "",
            status: "Confirmed",
          });
        }, 800);
      }
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Something went wrong. Please try again.",
        "error",
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <>
      {/* Processing overlay rendered ON TOP — keeps PaymentElement mounted underneath */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-box">
            <div className="processing-spinner" />
            <p className="processing-step">{processingStep}</p>
            <p className="processing-sub">Please do not close this window</p>
          </div>
        </div>
      )}

      <div
        className="gateway-layout"
        style={{ visibility: isProcessing ? "hidden" : "visible" }}
      >
        <div className="card-form-section">
          <div className="secure-badge">
            <span>🔒</span>
            <span>256-bit SSL Encrypted</span>
          </div>
          <PaymentElement
            onReady={() => setIsElementReady(true)}
            options={{
              layout: "tabs",
              defaultValues: {
                billingDetails: {
                  name: bookingData?.billing?.fullName || "",
                  email: bookingData?.billing?.email || "",
                },
              },
            }}
          />
          <div className="payment-actions" style={{ marginTop: "24px" }}>
            <button
              className="btn-pay"
              onClick={handlePay}
              disabled={isProcessing || !isElementReady}
              style={{
                opacity: isElementReady ? 1 : 0.6,
                cursor: isElementReady ? "pointer" : "not-allowed",
              }}
            >
              {isElementReady
                ? `🔒 Pay LKR ${amount.toLocaleString()}`
                : "⏳ Loading payment form..."}
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
    </>
  );
}

// ── CAPTCHA Step ─────────────────────────────────────────────────────────────
function CaptchaStep({ onVerified }) {
  const recaptchaRef = useRef(null);
  const [verified, setVerified] = useState(false);

  const handleChange = (value) => {
    if (value) setVerified(true);
  };

  return (
    <div
      className="page-container"
      style={{ textAlign: "center", paddingTop: "60px" }}
    >
      <div className="payment-header">
        <h1>Security Check</h1>
        <p>Please verify you are human before proceeding to payment</p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "24px",
          marginTop: "40px",
        }}
      >
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          onChange={handleChange}
          onExpired={() => setVerified(false)}
        />

        <button
          className="btn-pay"
          disabled={!verified}
          onClick={onVerified}
          style={{
            opacity: verified ? 1 : 0.5,
            cursor: verified ? "pointer" : "not-allowed",
          }}
        >
          Continue to Payment →
        </button>
      </div>
    </div>
  );
}

// ── Main Wrapper ─────────────────────────────────────────────────────────────
function PaymentGateway({ onNavigate, room }) {
  const bookingData = room || null;
  const [clientSecret, setClientSecret] = useState("");
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookingData?.amount || !bookingData?.reservationId) return;

    const createIntent = async () => {
      try {
        const res = await fetch(
          "http://localhost:5000/api/payments/create-intent",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeaders(),
            },
            body: JSON.stringify({ amount: bookingData.amount }),
          },
        );

        const data = await res.json();
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          showToast("Failed to initialize payment", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Cannot connect to payment server", "error");
      } finally {
        setLoading(false);
      }
    };

    createIntent();
  }, [bookingData?.amount, bookingData?.reservationId]);

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

  // Step 1: CAPTCHA
  if (!captchaPassed) {
    return <CaptchaStep onVerified={() => setCaptchaPassed(true)} />;
  }

  // Step 2: Payment loading
  if (loading || !clientSecret) {
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
