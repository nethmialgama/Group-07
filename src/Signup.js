// src/Signup.js
import React, { useState } from "react";
import "./Signup.css";

// Password strength helpers
const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { label: "At least one number", test: (p) => /[0-9]/.test(p) },
  { label: "At least one special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function getPasswordStrength(password) {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { level: "weak", color: "#e74c3c", label: "Weak" };
  if (passed <= 3) return { level: "fair", color: "#f39c12", label: "Fair" };
  if (passed === 4) return { level: "good", color: "#2ecc71", label: "Good" };
  return { level: "strong", color: "#27ae60", label: "Strong" };
}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

function Signup({ onLoginClick, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    nic_or_passport: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;

    if (name === "phone") {
      finalValue = value.replace(/\D/g, "");
      if (finalValue.length > 10) return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: finalValue,
    }));
    setError("");
  };

  const handleSignup = async () => {
    // Validation
    if (!formData.name || !formData.email || !formData.password || !formData.nic_or_passport) {
      setError("Please fill in all required fields");
      return;
    }

    if (!EMAIL_REGEX.test(formData.email)) {
      setError("Please enter a valid email address (e.g. user@example.com)");
      return;
    }

    const failedRules = PASSWORD_RULES.filter((r) => !r.test(formData.password));
    if (failedRules.length > 0) {
      setError("Password must meet all strength requirements below");
      setShowPasswordRules(true);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          nic_or_passport: formData.nic_or_passport,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess("Account created successfully! Redirecting to login...");
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          phone: "",
          nic_or_passport: "",
        });
        setTimeout(() => {
          onLoginClick();
        }, 2000);
      } else {
        setError(data.error || "Signup failed");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Connection error. Make sure backend is running on port 5000");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-overlay"></div>

      <div className="signup-content">
        {/* Branding Section */}
        <div className="brand-section">
          <h1>Smart Hotel</h1>
          <p>Your perfect stay awaits</p>
        </div>

        {/* Signup Form */}
        <div className="form-section">
          <div className="signup-card">
            <h2>Sign up for an account</h2>

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
            {success && (
              <div
                style={{
                  color: "green",
                  marginBottom: "10px",
                  fontSize: "0.9rem",
                }}
              >
                {success}
              </div>
            )}

            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="example@gmail.com"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Phone (Optional)</label>
              <input
                type="tel"
                placeholder="Enter phone number"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>NIC/Passport <span style={{ color: "#e74c3c" }}>*</span></label>
              <input
                type="text"
                placeholder="Enter NIC or passport number"
                name="nic_or_passport"
                value={formData.nic_or_passport}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password <span style={{ color: "#e74c3c" }}>*</span></label>
              <input
                type="password"
                placeholder="Min 8 chars, upper, lower, number, symbol"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onFocus={() => setShowPasswordRules(true)}
              />
              {formData.password && (() => {
                const strength = getPasswordStrength(formData.password);
                return (
                  <div style={{ marginTop: "6px" }}>
                    <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            height: "4px",
                            borderRadius: "2px",
                            backgroundColor:
                              i <= PASSWORD_RULES.filter((r) => r.test(formData.password)).length
                                ? strength.color
                                : "#ddd",
                            transition: "background-color 0.3s",
                          }}
                        />
                      ))}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: strength.color, fontWeight: 600 }}>
                      {strength.label}
                    </span>
                  </div>
                );
              })()}
              {showPasswordRules && (
                <ul style={{ marginTop: "8px", paddingLeft: "18px", fontSize: "0.78rem", color: "#555" }}>
                  {PASSWORD_RULES.map((rule) => (
                    <li
                      key={rule.label}
                      style={{
                        color: rule.test(formData.password) ? "#27ae60" : "#e74c3c",
                        listStyleType: rule.test(formData.password) ? "'✓ '" : "'✗ '",
                      }}
                    >
                      {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input
                type="password"
                placeholder="Confirm password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <button
              className="signup-btn"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>

            <div className="login-link-text">
              Already have an account?
              <span onClick={onLoginClick}>Login</span>
            </div>

            {/* Back to Home Helper */}
            <div style={{ textAlign: "center", marginTop: "15px" }}>
              <span
                onClick={onBack}
                style={{
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  textDecoration: "underline",
                }}
              >
                ← Back to Home
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

export default Signup;
