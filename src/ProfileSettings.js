// src/ProfileSettings.js
import React, { useEffect, useState } from "react";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

function ProfileSettings({ onNavigate, onLogout }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: {
            ...getAuthHeaders(),
          },
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load profile");
        }

        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
        });
      } catch (err) {
        console.error(err);
        showToast(err.message, "error");
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          email: profile.email,
          phone: profile.phone,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      showToast("Profile updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{ background: "#f8f9fa", minHeight: "100vh" }}
    >
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
              <h2>{profile.name || "Guest User"}</h2>
              <p>{profile.email || "-"}</p>
            </div>
            <button className="btn-blue-small">Change Profile Picture</button>
          </div>

          {/* Card 2: Personal Information */}
          <div className="settings-card">
            <h3>Personal Information</h3>
            <form className="settings-form" onSubmit={handleSave}>
              <div className="form-group-row">
                <label>Full Name</label>
                <input type="text" value={profile.name} disabled />
              </div>
              <div className="form-group-row">
                <label>Email Address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group-row">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div className="form-group-row">
                <label>Date Of Birth</label>
                <input type="text" placeholder="" />
              </div>
              <div className="form-group-row">
                <label>Address</label>
                <input type="text" placeholder="" />
              </div>

              <div style={{ textAlign: "right", marginTop: "20px" }}>
                <button className="btn-blue" disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
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
                <input type="checkbox" defaultChecked /> Receive booking
                confirmation emails
              </label>
              <label className="checkbox-item">
                <input type="checkbox" defaultChecked /> Receive promotional
                offers
              </label>
              <label className="checkbox-item">
                <input type="checkbox" defaultChecked /> Enable two-factor
                authentication
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
