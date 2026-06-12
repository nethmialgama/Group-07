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
            <p className="processing-sub">Please do not close or refresh this window</p>
          </div>
        </div>
      )}

      <div
        className="gateway-layout"
        style={{ visibility: isProcessing ? "hidden" : "visible" }}
      >
        <div className="card-form-section">
          <div className="secure-badge">
            <svg className="secure-icon" viewBox="0 0 24 24" width="16" height="16">
              <path fill="currentColor" d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 15.5L7.5 13l1.41-1.41L11 13.67l4.59-4.59L17 10.5 11 16.5z"/>
            </svg>
            <span>Secure 256-bit SSL Encrypted Connection</span>
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
                ? `Confirm Payment: LKR ${amount.toLocaleString()}`
                : "Loading Secure Form..."}
            </button>
            <button
              className="btn-cancel-pay"
              onClick={() => onNavigate("payment", bookingData)}
            >
              Return to Billing
            </button>
          </div>
          <div className="payment-methods-badge">
            <span className="methods-label">Accepted Payment Methods</span>
            <div className="methods-icons">
              <span className="method-tag">VISA</span>
              <span className="method-tag">MASTERCARD</span>
              <span className="method-tag">AMEX</span>
              <span className="method-tag">STRIPE</span>
            </div>
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
            <div className="pay-amount-display">
              <span className="pay-amount-value">
                LKR {amount.toLocaleString()}
              </span>
              <span className="pay-amount-full">Full payment</span>
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

// ── Slip Upload Form ─────────────────────────────────────────────────────────
function SlipUploadForm({ onNavigate, bookingData }) {
  const [slipFile, setSlipFile] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");

  const amount = bookingData?.amount || 0;
  const billing = bookingData?.billing || {};

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please upload an image file (PNG, JPG, JPEG)", "error");
      return;
    }

    setSlipFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSlipPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!slipPreview) {
      showToast("Please select a slip image file first.", "error");
      return;
    }

    setIsProcessing(true);
    setProcessingStep("Uploading slip and submitting booking...");

    try {
      const response = await fetch("http://localhost:5000/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          reservationId: bookingData.reservationId,
          amount: amount,
          payment_method: "Slip",
          status: "Pending",
          slip_image: slipPreview,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to record payment");
      }

      setProcessingStep("Upload successful! ✓");

      setTimeout(() => {
        onNavigate("payment-confirmation", {
          ...bookingData,
          paymentId: data.paymentId,
          paidAmount: amount,
          remaining: 0,
          status: "Pending",
        });
      }, 800);
    } catch (err) {
      console.error(err);
      showToast(
        err.message || "Failed to upload bank slip. Please try again.",
        "error",
      );
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  return (
    <>
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-box">
            <div className="processing-spinner" />
            <p className="processing-step">{processingStep}</p>
            <p className="processing-sub">
              Please do not close or refresh this window
            </p>
          </div>
        </div>
      )}

      <div
        className="gateway-layout"
        style={{ visibility: isProcessing ? "hidden" : "visible" }}
      >
        <div className="card-form-section">
          <div
            className="bank-details-card"
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "20px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                color: "#1e293b",
                borderBottom: "1px solid #e2e8f0",
                paddingBottom: "10px",
              }}
            >
              Hotel Bank Account Details
            </h3>
            <p style={{ fontSize: "14px", color: "#64748b" }}>
              Please transfer the full booking amount of{" "}
              <strong>LKR {amount.toLocaleString()}</strong> to the following
              account, then upload your deposit slip or transaction screenshot.
            </p>
            <div
              style={{
                display: "grid",
                gap: "10px",
                marginTop: "15px",
                fontSize: "14px",
              }}
            >
              <div>
                <strong>Bank Name:</strong> Ceylono International Bank
              </div>
              <div>
                <strong>Account Number:</strong> 1002-3948-2938
              </div>
              <div>
                <strong>Branch:</strong> Colombo Fort
              </div>
              <div>
                <strong>Account Name:</strong> Ceylono Hotels (Pvt) Ltd
              </div>
            </div>
          </div>

          <div
            style={{
              border: "2px dashed #cbd5e1",
              borderRadius: "8px",
              padding: "30px",
              textAlign: "center",
              background: "#fafafa",
              cursor: "pointer",
              position: "relative",
            }}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0,
                cursor: "pointer",
              }}
            />
            {slipPreview ? (
              <div>
                <img
                  src={slipPreview}
                  alt="Slip Preview"
                  style={{
                    maxHeight: "150px",
                    maxWidth: "100%",
                    borderRadius: "4px",
                    marginBottom: "10px",
                  }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    color: "#059669",
                    fontWeight: "bold",
                  }}
                >
                  ✓ {slipFile?.name} (Click or drag to change)
                </p>
              </div>
            ) : (
              <div>
                <svg
                  viewBox="0 0 24 24"
                  width="48"
                  height="48"
                  style={{ color: "#94a3b8", marginBottom: "10px" }}
                >
                  <path
                    fill="currentColor"
                    d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"
                  />
                </svg>
                <p style={{ margin: 0, fontSize: "15px", color: "#64748b" }}>
                  Click or Drag & Drop to Upload Bank Slip
                </p>
                <p
                  style={{
                    margin: "5px 0 0",
                    fontSize: "12px",
                    color: "#94a3b8",
                  }}
                >
                  Supports PNG, JPG, JPEG
                </p>
              </div>
            )}
          </div>

          <div className="payment-actions" style={{ marginTop: "24px" }}>
            <button
              className="btn-pay"
              onClick={handleUpload}
              disabled={isProcessing || !slipPreview}
              style={{
                opacity: slipPreview ? 1 : 0.6,
                cursor: slipPreview ? "pointer" : "not-allowed",
              }}
            >
              Upload Slip & Confirm Booking
            </button>
            <button
              className="btn-cancel-pay"
              onClick={() => onNavigate("payment", bookingData)}
            >
              Return to Billing
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
            <div className="pay-amount-display">
              <span className="pay-amount-value">
                LKR {amount.toLocaleString()}
              </span>
              <span className="pay-amount-full">Full payment</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main Wrapper ─────────────────────────────────────────────────────────────
function PaymentGateway({ onNavigate, room }) {
  const bookingData = room || null;
  const [clientSecret, setClientSecret] = useState("");
  const [captchaPassed, setCaptchaPassed] = useState(false);
  const [loading, setLoading] = useState(bookingData?.paymentMethod !== "slip");

  useEffect(() => {
    if (bookingData?.paymentMethod === "slip") {
      setLoading(false);
      return;
    }
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
  }, [bookingData?.amount, bookingData?.reservationId, bookingData?.paymentMethod]);

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
  if (loading || (!clientSecret && bookingData?.paymentMethod !== "slip")) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <p>Initializing secure payment gateway...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="payment-header">
        <h1>Payment Gateway</h1>
        <p>All transactions are secure and encrypted</p>
      </div>

      <div className="payment-steps">
        <div className="step done">
          <span className="step-number">1</span>
          <span className="step-label">Billing Info</span>
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

      {bookingData?.paymentMethod === "slip" ? (
        <SlipUploadForm onNavigate={onNavigate} bookingData={bookingData} />
      ) : (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#4f46e5",
                colorBackground: "#ffffff",
                colorText: "#1e293b",
                colorDanger: "#df1b41",
                fontFamily: "Inter, system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "8px",
              },
            },
          }}
        >
          <CheckoutForm onNavigate={onNavigate} bookingData={bookingData} />
        </Elements>
      )}
    </div>
  );
}

export default PaymentGateway;
