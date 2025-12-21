// src/AdminLogin.js
import React, { useState } from 'react';

function AdminLogin({ onNavigate }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    // Simple mock validation for demonstration
    if (email === 'admin@smarthotel.com' && password === 'admin123') {
      alert('Admin Login Successful!');
      onNavigate('admin-dashboard'); // We will build this dashboard next
    } else {
      alert('Invalid Admin Credentials! (Try: admin@smarthotel.com / admin123)');
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
              <input type="checkbox" id="admin-remember" />
              <label htmlFor="admin-remember">Remember Me</label>
            </div>
            <span className="forgot-pass">Forgot password?</span>
          </div>

          <button type="submit" className="btn-admin-login">Login</button>
        </form>

        <div className="back-home">
          <span onClick={() => onNavigate('home')}>Back to Home</span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;