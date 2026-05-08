// src/ResetPassword.js
import React, { useState, useEffect } from "react";
import "./Login.css";

function ResetPassword({ onBackToLogin }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState("");
  const [tokenValid, setTokenValid] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("token");
    if (!t) {
      setTokenValid(false);
    } else {
      setToken(t);
    }
  }, []);

  const getPasswordStrength = (pwd) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 6) return { label: "Too short", color: "#e74c3c" };
    if (pwd.length < 8) return { label: "Weak", color: "#e67e22" };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
    if (score === 3) return { label: "Strong", color: "#27ae60" };
    if (score >= 1) return { label: "Moderate", color: "#f1c40f" };
    return { label: "Fair", color: "#e67e22" };
  };

  const handleReset = async () => {
    setError("");

    if (!password || !confirm) {
      setError("Please fill in both fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/reset-password",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setSuccess(true);
      } else {
        setError(data.error || "Failed to reset password. Please try again.");
      }
    } catch (err) {
      setError("Connection error. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(password);

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
            {!tokenValid ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>⚠️</div>
                <h2>Invalid Link</h2>
                <p style={{ color: "#666", margin: "15px 0" }}>
                  This password reset link is invalid or has already been used.
                </p>
                <button className="login-btn" onClick={onBackToLogin}>
                  Back to Login
                </button>
              </div>
            ) : success ? (
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <div style={{ fontSize: "3rem", marginBottom: "15px" }}>✅</div>
                <h2>Password Reset!</h2>
                <p
                  style={{ color: "#555", margin: "15px 0", lineHeight: "1.6" }}
                >
                  Your password has been successfully updated. You can now log
                  in with your new password.
                </p>
                <button className="login-btn" onClick={onBackToLogin}>
                  Go to Login
                </button>
              </div>
            ) : (
              <>
                <h2>Reset Password</h2>
                <p
                  style={{
                    color: "#666",
                    marginBottom: "20px",
                    fontSize: "0.9rem",
                  }}
                >
                  Choose a strong new password for your account.
                </p>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {strength && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.8rem",
                        color: strength.color,
                        fontWeight: "600",
                      }}
                    >
                      Password strength: {strength.label}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleReset()}
                  />
                  {confirm && password !== confirm && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.8rem",
                        color: "#e74c3c",
                      }}
                    >
                      Passwords do not match
                    </div>
                  )}
                  {confirm && password === confirm && confirm.length > 0 && (
                    <div
                      style={{
                        marginTop: "6px",
                        fontSize: "0.8rem",
                        color: "#27ae60",
                      }}
                    >
                      ✓ Passwords match
                    </div>
                  )}
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
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>

                <div style={{ textAlign: "center", marginTop: "15px" }}>
                  <span
                    onClick={onBackToLogin}
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
            )}
          </div>
        </div>
      </div>

      <div className="copyright">© 2025 Smart Hotel. All rights reserved</div>
    </div>
  );
}

export default ResetPassword;
