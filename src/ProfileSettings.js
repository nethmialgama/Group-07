// src/ProfileSettings.js
import React, { useEffect, useState } from "react";
import { getAuthHeaders, getStoredAuth } from "./auth";
import { showToast } from "./toast";

function ProfileSettings({ onNavigate, onLogout }) {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const role = getStoredAuth().role || "Guest";
  const avatarSrc =
    role === "Admin" ? "/images/profile1.png" : "/images/profile2.png";

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/auth/profile", {
          headers: { ...getAuthHeaders() },
        });

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error || "Failed to load profile");

        setProfile({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          dob: data.dob || "",
          address: data.address || "",
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
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({
          email: profile.email,
          phone: profile.phone,
          dob: profile.dob,
          address: profile.address,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update profile");

      showToast("Profile updated successfully", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      return showToast("Please fill all password fields", "warning");
    }
    if (passwordForm.newPassword.length < 8) {
      return showToast("New password must be at least 8 characters", "warning");
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return showToast("Passwords do not match", "warning");
    }

    setChangingPassword(true);
    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/change-password",
        {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        },
      );

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to change password");

      showToast("Password updated successfully", "success");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/account", {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to delete account");

      showToast("Account deleted successfully", "success");
      onLogout();
      onNavigate("home");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setDeletingAccount(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{ background: "#EDE9FE", minHeight: "100vh" }}
    >
      <div className="settings-header">
        <h1>Profile Settings</h1>
        <p>Manage your account details and preferences.</p>
      </div>

      <div className="settings-grid-layout">
        {/* Left Column */}
        <div className="settings-left-col">
          <div className="settings-card profile-header-card">
            <div className="avatar-circle-large">
              <img src={avatarSrc} alt="Profile" />
            </div>
            <div className="profile-text-group">
              <h2>{profile.name || "Guest User"}</h2>
              <p>{profile.email || "-"}</p>
            </div>
          </div>

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
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={profile.dob}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, dob: e.target.value }))
                  }
                />
              </div>
              <div className="form-group-row">
                <label>Address</label>
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) =>
                    setProfile((prev) => ({ ...prev, address: e.target.value }))
                  }
                />
              </div>

              <div style={{ textAlign: "right", marginTop: "20px" }}>
                <button className="btn-blue" disabled={saving} type="submit">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="settings-right-col">
          <div className="settings-card">
            <h3>Change Password</h3>
            <form
              className="settings-form-stacked"
              onSubmit={handlePasswordChange}
            >
              <label>Current Password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    currentPassword: e.target.value,
                  }))
                }
              />

              <label>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    newPassword: e.target.value,
                  }))
                }
              />

              <label>Confirm New Password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value,
                  }))
                }
              />

              <button
                className="btn-blue full-width"
                type="submit"
                disabled={changingPassword}
              >
                {changingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          <div className="settings-card">
            <button
              className="btn-red full-width"
              type="button"
              disabled={deletingAccount}
              onClick={() => setShowDeleteConfirm(true)}
            >
              {deletingAccount ? "Deleting..." : "Delete My Account"}
            </button>
          </div>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="account-delete-modal-overlay">
          <div className="account-delete-modal-content">
            <h3>Delete Account</h3>
            <p>Are you sure? This action cannot be undone.</p>
            <div className="account-delete-modal-actions">
              <button
                className="btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="btn-red"
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
              >
                {deletingAccount ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSettings;
