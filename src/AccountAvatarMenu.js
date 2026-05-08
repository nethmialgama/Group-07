import React, { useEffect, useRef, useState } from "react";
import { getStoredAuth } from "./auth";

function AccountAvatarMenu({ onNavigate, onLogout, role }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const storedRole = getStoredAuth().role || "";
  const effectiveRole = role || storedRole;
  const isAdmin = effectiveRole === "Admin";
  const avatarSrc = isAdmin ? "/images/profile1.png" : "/images/profile2.png";

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const navigateAndClose = (page) => {
    setOpen(false);
    onNavigate(page);
  };

  const logoutAndClose = () => {
    setOpen(false);
    onLogout();
  };

  return (
    <div className="account-avatar-menu" ref={menuRef}>
      <button
        type="button"
        className="account-avatar-button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Open profile menu"
        aria-expanded={open}
      >
        <img
          className="account-avatar-image"
          src={avatarSrc}
          alt={isAdmin ? "Admin profile" : "User profile"}
        />
      </button>

      {open ? (
        <div className="account-avatar-dropdown">
          <div className="account-avatar-label">
            {isAdmin ? "Admin profile" : "My profile"}
          </div>

          {!isAdmin ? (
            <>
              <button
                type="button"
                className="account-avatar-action"
                onClick={() => navigateAndClose("dashboard")}
              >
                Dashboard
              </button>
              <button
                type="button"
                className="account-avatar-action"
                onClick={() => navigateAndClose("profile-settings")}
              >
                Profile Settings
              </button>
            </>
          ) : (
            <button
              type="button"
              className="account-avatar-action"
              onClick={() => navigateAndClose("admin-dashboard")}
            >
              Admin Dashboard
            </button>
          )}

          <button
            type="button"
            className="account-avatar-action account-avatar-logout"
            onClick={logoutAndClose}
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default AccountAvatarMenu;
