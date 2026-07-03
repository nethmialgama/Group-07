// src/Login.js
import React from 'react';
import './Login.css';

// We added 'onSignupClick' to the properties here
function Login({ onLogin, onBack, onSignupClick }) {
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
              <label>Email</label>
              <input type="email" placeholder="example@gmail.com" />
            </div>

            <div className="form-group">
              <div className="password-label-row">
                <label>Password</label>
                <a href="#" className="forgot-password">Forgot password?</a>
              </div>
              <input type="password" placeholder="Enter password" />
            </div>

            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>

            <button className="login-btn" onClick={onLogin}>Login</button>

            <div className="signup-link">
              Don't have an account? 
              {/* This span now triggers the signup page switch */}
              <span onClick={onSignupClick}>Sign up here</span>
            </div>
            
            <div style={{textAlign: 'center', marginTop: '15px'}}>
                <span onClick={onBack} style={{cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline'}}>← Back to Home</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="copyright">
        © 2025 Smart Hotel. All rights reserved
      </div>
    </div>
  );
}

export default Login;