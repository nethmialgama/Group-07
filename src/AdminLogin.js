// src/AdminLogin.js
import React, { useState } from "react";
import { showToast } from "./toast";
import { persistAuth } from "./auth";

function AdminLogin({ onNavigate, onAdminLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showToast(data.error || "Admin login failed", "error");
        return;
      }

      if (data.role !== "Admin") {
        showToast("This account is not an admin account.", "error");
        return;
      }

      persistAuth(data, { rememberMe });

      showToast("Admin login successful", "success");
      onAdminLogin(data);
    } catch (err) {
      console.error(err);
      showToast("Connection error. Is the backend running?", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container admin-login-container">
      <div className="admin-login-overlay"></div>

      <div className="admin-login-card">
        <div className="admin-header">
          <h1>Admin Login</h1>
          <p>Enter your credentials to access the Admin Panel.</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email/Username</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                type="email"
                placeholder="admin@smarthotel.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </span>
            </div>
          </div>

          <div className="admin-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="admin-remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="admin-remember">Remember Me</label>
            </div>
            <span className="forgot-pass">Forgot password?</span>
          </div>

          <button type="submit" className="btn-admin-login" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="back-home">
          <span onClick={() => onNavigate("home")}>Back to Home</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
