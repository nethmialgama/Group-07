// src/Signup.js
import React, { useState } from "react";
import "./Signup.css";

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
    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
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
              <label>NIC/Passport (Optional)</label>
              <input
                type="text"
                placeholder="Enter NIC or passport"
                name="nic_or_passport"
                value={formData.nic_or_passport}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password (min 6 chars)"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
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

      <div className="copyright">© 2025 Smart Hotel. All rights reserved</div>
    </div>
  );
}

export default Signup;
