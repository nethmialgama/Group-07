// src/ProfileSettings.js
import React from 'react';

function ProfileSettings({ onNavigate, onLogout }) {
  return (
    <div className="page-container" style={{background: '#f8f9fa', minHeight: '100vh'}}>
      <div className="settings-header">
        <h1>Profile Settings</h1>
        <p>Manage your account details and preferences.</p>
      </div>

      <div className="settings-grid-layout">
        {/* LEFT COLUMN (WIDER) */}
        <div className="settings-left-col">
          
          {/* Card 1: Profile Header */}
          <div className="settings-card profile-header-card">
            <div className="avatar-circle-large">N</div>
            <div className="profile-text-group">
               <h2>Nethmi Algama</h2>
               <p>nethmi@gmail.com</p>
            </div>
            <button className="btn-blue-small">Change Profile Picture</button>
          </div>

          {/* Card 2: Personal Information */}
          <div className="settings-card">
            <h3>Personal Information</h3>
            <form className="settings-form">
              <div className="form-group-row">
                 <label>Full Name</label>
                 <input type="text" defaultValue="Nethmi Algama" />
              </div>
              <div className="form-group-row">
                 <label>Email Address</label>
                 <input type="email" defaultValue="nethmi@gmail.com" />
              </div>
              <div className="form-group-row">
                 <label>Phone Number</label>
                 <input type="text" defaultValue="0771234567" />
              </div>
              <div className="form-group-row">
                 <label>Date Of Birth</label>
                 <input type="text" placeholder="" />
              </div>
              <div className="form-group-row">
                 <label>Address</label>
                 <input type="text" placeholder="" />
              </div>

              <div style={{textAlign: 'right', marginTop: '20px'}}>
                 <button className="btn-blue">Save Changes</button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN (NARROWER) */}
        <div className="settings-right-col">
          
          {/* Card 3: Change Password */}
          <div className="settings-card">
            <h3>Change Password</h3>
            <form className="settings-form-stacked">
              <label>Current Password</label>
              <input type="password" />
              
              <label>New Password</label>
              <input type="password" />
              
              <label>Confirm Password</label>
              <input type="password" />

              <button className="btn-blue full-width">Update Password</button>
            </form>
          </div>

          {/* Card 4: Preferences */}
          <div className="settings-card">
            <h3>Preferences</h3>
            <div className="checkbox-list">
               <label className="checkbox-item">
                 <input type="checkbox" defaultChecked /> Receive booking confirmation emails
               </label>
               <label className="checkbox-item">
                 <input type="checkbox" defaultChecked /> Receive promotional offers
               </label>
               <label className="checkbox-item">
                 <input type="checkbox" defaultChecked /> Enable two-factor authentication
               </label>
            </div>

            <div className="danger-zone">
              <h4>Danger Zone</h4>
              <button className="btn-red full-width">Delete My Account</button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ProfileSettings;