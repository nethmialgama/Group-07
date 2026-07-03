import React from 'react';
import AdminSidebar from './AdminSidebar';

function AdminUsers({ onNavigate }) {
  const users = [
    { id: "U001", name: "Nethmi Algama", email: "nethmi@gmail.com", phone: "1234567890", role: "User", status: "Active" },
    { id: "U002", name: "Malith Dilshan", email: "malith@gmail.com", phone: "1234567890", role: "User", status: "Blocked" },
  ];

  return (
    <div className="admin-container">
      <AdminSidebar activePage="users" onNavigate={onNavigate} />
      <div className="admin-content">
        <div className="admin-header-row">
          <h2>User Management</h2>
          <div className="admin-user-profile">👤 Admin</div>
        </div>

        <div className="action-bar">
           <button className="btn-blue">+ Add New User</button>
           <button className="btn-white">Export Data</button>
        </div>

        <div className="table-card">
          <table className="admin-table full-width">
            <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td><td>{user.name}</td><td>{user.email}</td><td>{user.phone}</td><td>{user.role}</td>
                  <td><span className={user.status === 'Active' ? 'badge-avail' : 'badge-booked'}>{user.status}</span></td>
                  <td>
                    <button className="btn-action view" onClick={() => onNavigate('admin-user-view')}>View</button>
                    <button className="btn-action edit">Edit</button>
                    <button className="btn-action delete">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Booking History Section from Design */}
        <div className="table-card" style={{marginTop:'30px'}}>
           <h3>Booking History</h3>
           <table className="admin-table full-width">
              <thead><tr><th>Booking ID</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Status</th></tr></thead>
              <tbody>
                 <tr><td>B120</td><td>Deluxe Double</td><td>Oct 15</td><td>Oct 18</td><td>Completed</td></tr>
                 <tr><td>B121</td><td>Family Suite</td><td>Nov 3</td><td>Nov 6</td><td>Cancelled</td></tr>
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
export default AdminUsers;