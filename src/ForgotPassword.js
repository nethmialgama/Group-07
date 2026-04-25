// src/ForgotPassword.js
import React, { useState } from "react";
import "./Login.css";

function ForgotPassword({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-overlay"></div>

      <div className="login-content">
        <div className="brand-section">
          <h1>Smart Hotel</h1>
          <p>Your perfect stay awaits</p>
        </div>

        <div className="form-section">
          <div className="login-card">
            {!submitted ? (
              <>
                <h2>Forgot Password</h2>
                <p
                  style={{
                    color: "#666",
                    marginBottom: "20px",
                    fontSize: "0.9rem",
                  }}
                >
                  Enter the email address linked to your account and we'll send
                  you a password reset link.
                </p>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSubmit()}
                  />
                </div>

                {error && (
                  <div
                    style={{
                      color: "red",
                      marginBottom: "10px",
                      fontSize: "0.9rem",
                    }}
                  >
                    {error}
                  </div>
                )}

                <button
                  className="login-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </button>

                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <span
                    onClick={onBack}
                    style={{
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      textDecoration: "underline",
                    }}
                  >
                    ← Back to Login
                  </span>
                </div>
              </>
            ) : (
              <>
                <div style={{ textAlign: "center", padding: "10px 0" }}>
                  <div style={{ fontSize: "3rem", marginBottom: "15px" }}>
                    📧
                  </div>
                  <h2>Check Your Email</h2>
                  <p
                    style={{
                      color: "#555",
                      margin: "15px 0",
                      lineHeight: "1.6",
                    }}
                  >
                    If <strong>{email}</strong> is registered with us, you will
                    receive a password reset link shortly.
                  </p>
                  <p
                    style={{
                      color: "#888",
                      fontSize: "0.85rem",
                      marginBottom: "25px",
                    }}
                  >
                    The link will expire in <strong>1 hour</strong>. Please also
                    check your spam folder.
                  </p>
                  <button className="login-btn" onClick={onBack}>
                    Back to Login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="copyright">© 2025 Smart Hotel. All rights reserved</div>
    </div>
  );
}

export default ForgotPassword;
