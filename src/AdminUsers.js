import React, { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";

function AdminUsers({ onNavigate, onLogout }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/admin/users", {
        headers: {
          ...getAuthHeaders(),
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load users");
      }

      setUsers(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const deleteUser = async (userId) => {
    if (!window.confirm("Delete this user account?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            ...getAuthHeaders(),
          },
        },
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      showToast("User deleted", "success");
      setUsers((prev) => prev.filter((u) => Number(u.id) !== Number(userId)));
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage="users" onNavigate={onNavigate} />
      <div className="admin-content">
        <div className="admin-header-row">
          <h2>User Management</h2>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
        </div>

        <div className="action-bar">
          <button className="btn-blue" disabled>
            + Add New User
          </button>
          <button className="btn-white">Export Data</button>
        </div>

        {loading ? <p>Loading users...</p> : null}

        <div className="table-card">
          <table className="admin-table full-width">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>{user.role}</td>
                  <td>
                    <span
                      className={
                        user.status === "Active"
                          ? "badge-avail"
                          : "badge-booked"
                      }
                    >
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-action view"
                      onClick={() => onNavigate("admin-user-view", user)}
                    >
                      View
                    </button>
                    <button className="btn-action edit" disabled>
                      Edit
                    </button>
                    <button
                      className="btn-action delete"
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Booking History Section from Design */}
        <div className="table-card" style={{ marginTop: "30px" }}>
          <h3>Booking History</h3>
          <table className="admin-table full-width">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Room</th>
                <th>Check-in</th>
                <th>Check-out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>B120</td>
                <td>Deluxe Double</td>
                <td>Oct 15</td>
                <td>Oct 18</td>
                <td>Completed</td>
              </tr>
              <tr>
                <td>B121</td>
                <td>Family Suite</td>
                <td>Nov 3</td>
                <td>Nov 6</td>
                <td>Cancelled</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default AdminUsers;
