import React, { useEffect, useState, useRef } from "react";
import { getAuthHeaders } from "./auth";

function PaymentConfirmation({ onNavigate, room }) {
  const data = room || null;
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const emailSentRef = useRef(false);

  useEffect(() => {
    if (data?.paymentId && !emailSentRef.current) {
      emailSentRef.current = true;
      sendInvoiceEmail();
    }
  }, []);

  const sendInvoiceEmail = async () => {
    setEmailSending(true);
    try {
      await fetch("http://localhost:5000/api/payments/send-invoice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ paymentId: data.paymentId }),
      });
      setEmailSent(true);
    } catch (err) {
      console.error("Email send failed:", err);
    } finally {
      setEmailSending(false);
    }
  };

  const handleDownloadPDF = async () => {
    setPdfLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/payments/invoice-pdf/${data.paymentId}`,
        {
          headers: { ...getAuthHeaders() },
        },
      );

      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `SmartHotel-Invoice-${data.paymentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Could not download invoice. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (!data) {
    return (
      <div
        className="page-container"
        style={{ textAlign: "center", paddingTop: "80px" }}
      >
        <h2>No payment record found</h2>
        <button className="btn-blue" onClick={() => onNavigate("dashboard")}>
          Go to Dashboard
        </button>
      </div>
    );
  }

  const billing = data.billing || {};
  const paid = Number(data.paidAmount || data.amount || 0);
  const remaining = Number(data.remaining || 0);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="payment-header">
        <h1>Booking Confirmed! 🎉</h1>
        <p>Your payment was successful and your room is reserved.</p>
      </div>

      {/* Step indicator — all done */}
      <div className="payment-steps">
        <div className="step done">
          <span className="step-number">✓</span>
          <span className="step-label">Review &amp; Billing</span>
        </div>
        <div className="step-line done" />
        <div className="step done">
          <span className="step-number">✓</span>
          <span className="step-label">Payment</span>
        </div>
        <div className="step-line done" />
        <div className="step active">
          <span className="step-number">3</span>
          <span className="step-label">Confirmation</span>
        </div>
      </div>

      {/* Invoice card */}
      <div className="invoice-card">
        {/* Invoice header */}
        <div className="invoice-header-row">
          <div>
            <h2 className="invoice-title">Smart Hotel</h2>
            <p className="invoice-subtitle">
              123 Hotel Road, Colombo, Sri Lanka
            </p>
            <p className="invoice-subtitle">
              smarthotel@gmail.com · +94 112 345 678
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="invoice-badge">✓ PAID</div>
            <p className="invoice-id">Invoice #{data.paymentId}</p>
            <p className="invoice-date">
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="invoice-divider" />

        {/* Billing info */}
        <div className="invoice-two-col">
          <div>
            <p className="invoice-section-label">BILLED TO</p>
            <p className="invoice-value">{billing.fullName || "-"}</p>
            <p className="invoice-value">{billing.email || "-"}</p>
            <p className="invoice-value">{billing.phone || "-"}</p>
            <p className="invoice-value">{billing.address || "-"}</p>
          </div>
          <div>
            <p className="invoice-section-label">BOOKING DETAILS</p>
            <p className="invoice-value">
              <strong>Room:</strong> {data.title || "-"}
            </p>
            <p className="invoice-value">
              <strong>Check-in:</strong> {data.checkIn || "-"}
            </p>
            <p className="invoice-value">
              <strong>Check-out:</strong> {data.checkOut || "-"}
            </p>
            {data.guests && (
              <p className="invoice-value">
                <strong>Guests:</strong> {data.guests}
              </p>
            )}
            <p className="invoice-value">
              <strong>Payment method:</strong>{" "}
              {data.cardBrand
                ? `${data.cardBrand} ····${data.cardLast4}`
                : "Card"}
            </p>
          </div>
        </div>

        <div className="invoice-divider" />

        {/* Amount table */}
        <table className="invoice-table">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ textAlign: "right" }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {data.title || "Hotel Room"} — {data.checkIn} to {data.checkOut}
              </td>
              <td style={{ textAlign: "right" }}>
                LKR {paid.toLocaleString()}
              </td>
            </tr>
            {remaining > 0 && (
              <tr className="invoice-remaining-row">
                <td>Remaining balance (payable at hotel)</td>
                <td style={{ textAlign: "right" }}>
                  LKR {remaining.toLocaleString()}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="invoice-total-row">
              <td>
                <strong>Amount Paid Today</strong>
              </td>
              <td style={{ textAlign: "right" }}>
                <strong>LKR {paid.toLocaleString()}</strong>
              </td>
            </tr>
          </tfoot>
        </table>

        <div className="invoice-divider" />

        {/* Email status */}
        <div className="invoice-email-row">
          {emailSending && (
            <p className="invoice-email-status sending">
              📧 Sending invoice to {billing.email}...
            </p>
          )}
          {emailSent && (
            <p className="invoice-email-status sent">
              ✅ Invoice emailed to <strong>{billing.email}</strong>
            </p>
          )}
          {!emailSending && !emailSent && (
            <button className="btn-link" onClick={sendInvoiceEmail}>
              📧 Resend invoice email
            </button>
          )}
        </div>

        {/* Action buttons */}
        <div className="invoice-actions">
          <button
            className="btn-pay"
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
          >
            {pdfLoading ? "Generating PDF..." : "⬇ Download Invoice PDF"}
          </button>
          <button className="btn-blue" onClick={() => onNavigate("dashboard")}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentConfirmation;
