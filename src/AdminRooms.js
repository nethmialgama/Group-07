import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';

function AdminRooms({ onNavigate }) {
  const [rooms] = useState([
    { id: "R101", name: "Standard Single", type: "Single", price: "6,000", avail: "Available" },
    { id: "R102", name: "Deluxe Double", type: "Double", price: "3,500", avail: "Booked Out" },
    { id: "R103", name: "Family Suite", type: "Suite", price: "20,000", avail: "Available" },
  ]);

  return (
    <div className="admin-container">
      <AdminSidebar activePage="rooms" onNavigate={onNavigate} />
      <div className="admin-content">
        <div className="admin-header-row">
          <h2>Room Management</h2>
          <div className="admin-user-profile">👤 Admin</div>
        </div>

        <div className="action-bar">
          <button className="btn-blue">+ Add New Room</button>
          <button className="btn-white">Export Data</button>
        </div>

        <div className="admin-split-layout">
          <div className="admin-main-panel">
            <table className="admin-table">
              <thead><tr><th>ID</th><th>Room Name</th><th>Type</th><th>Price</th><th>Availability</th></tr></thead>
              <tbody>
                {rooms.map(r => (
                  <tr key={r.id}>
                    <td>{r.id}</td><td>{r.name}</td><td>{r.type}</td><td>LKR {r.price}</td>
                    <td><span className={r.avail === 'Available' ? 'badge-avail' : 'badge-booked'}>{r.avail}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="admin-notification-box">
               <h4>Notifications</h4>
               <p>3 Rooms low in availability</p>
               <p>New room type added yesterday</p>
            </div>
          </div>

          <div className="admin-side-panel">
            <h3>Add / Edit Room</h3>
            <form>
              <label>Room Name</label><input type="text" />
              <label>Room Type</label><select><option>Single</option><option>Double</option></select>
              <label>Price</label><input type="text" />
              <label>Availability</label>
              <div className="toggle-switch"><input type="checkbox" defaultChecked /> Available</div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminRooms;