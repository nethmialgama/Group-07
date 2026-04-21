// src/Login.js
import React, { useState } from "react";
import "./Login.css";
import {
  getRememberedIdentifier,
  persistAuth,
  setRememberedIdentifier,
} from "./auth";

// We added 'onSignupClick' to the properties here
function Login({ onLogin, onBack, onSignupClick }) {
  const rememberedIdentifier = getRememberedIdentifier("user");
  const [identifier, setIdentifier] = useState(rememberedIdentifier);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(!!rememberedIdentifier);

  const handleLogin = async () => {
    setError("");
    if (!identifier || !password) {
      setError("Email/username and password are required");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: identifier, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        persistAuth(data, { rememberMe });
        setRememberedIdentifier("user", identifier, rememberMe);
        onLogin(data); // Call parent callback
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
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
            <h2>Login to your account</h2>

            <div className="form-group">
              <label>Email or Username</label>
              <input
                type="text"
                placeholder="Enter email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label>Password</label>
                <a href="#" className="forgot-password">
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>

            {error && (
              <div style={{ color: "red", marginBottom: "10px" }}>{error}</div>
            )}

            <div className="remember-me">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button
              className="login-btn"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="signup-link">
              Don't have an account?
              {/* This span now triggers the signup page switch */}
              <span onClick={onSignupClick}>Sign up here</span>
            </div>

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

export default Login;
