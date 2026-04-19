// src/Signup.js
import React from 'react';
import './Signup.css';

function Signup({ onLoginClick, onBack }) {
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
            
            <div className="form-group">
              <label>Name</label>
              <input type="text" placeholder="Enter your name" />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" placeholder="example@gmail.com" />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="Enter password" />
            </div>

            <div className="form-group">
              <label>Confirm password</label>
              <input type="password" placeholder="Confirm password" />
            </div>

            <button className="signup-btn">Sign up</button>

            <div className="login-link-text">
              Already have an account? 
              <span onClick={onLoginClick}>Login</span>
            </div>

             {/* Back to Home Helper */}
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

export default Signup;