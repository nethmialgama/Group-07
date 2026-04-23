import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AccountAvatarMenu from "./AccountAvatarMenu";
import { getAuthHeaders } from "./auth";
import { showToast } from "./toast";
import { useEffect } from "react";

function AdminRooms({ onNavigate, onLogout }) {
  const [rooms, setRooms] = useState([]);
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [form, setForm] = useState({
    roomNumber: "",
    roomType: "Single",
    capacity: 2,
    roomPrice: "",
    amenities: "",
    description: "",
    status: "Available",
  });

  const loadRooms = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/admin/rooms", {
        headers: {
          ...getAuthHeaders(),
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load rooms");
      }
      setRooms(data);
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  useEffect(() => {
    loadRooms();
  }, []);

  const saveRoom = async () => {
    try {
      const url = editingRoomId
        ? `http://localhost:5000/api/admin/rooms/${editingRoomId}`
        : "http://localhost:5000/api/admin/rooms";
      const method = editingRoomId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save room");
      }

      showToast(editingRoomId ? "Room updated" : "Room created", "success");
      setEditingRoomId(null);
      setForm({
        roomNumber: "",
        roomType: "Single",
        capacity: 2,
        roomPrice: "",
        amenities: "",
        description: "",
        status: "Available",
      });
      loadRooms();
    } catch (err) {
      console.error(err);
      showToast(err.message, "error");
    }
  };

  const startEdit = (room) => {
    setEditingRoomId(room.roomId);
    setForm({
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      capacity: room.capacity,
      roomPrice: room.roomPrice,
      amenities: room.amenities || "",
      description: room.description || "",
      status: room.status || "Available",
    });
  };

  return (
    <div className="admin-container">
      <AdminSidebar activePage="rooms" onNavigate={onNavigate} />
      <div className="admin-content">
        <div className="admin-header-row">
          <h2>Room Management</h2>
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role="Admin"
          />
        </div>

        <div className="action-bar">
          <button
            className="btn-blue"
            onClick={() => {
              setEditingRoomId(null);
              setForm({
                roomNumber: "",
                roomType: "Single",
                capacity: 2,
                roomPrice: "",
                amenities: "",
                description: "",
                status: "Available",
              });
            }}
          >
            + Add New Room
          </button>
          <button className="btn-white">Export Data</button>
        </div>

        <div className="admin-split-layout">
          <div className="admin-main-panel">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Room Name</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Availability</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map((r) => (
                  <tr
                    key={r.roomId}
                    onClick={() => startEdit(r)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{r.roomNumber}</td>
                    <td>{r.roomType}</td>
                    <td>{r.capacity}</td>
                    <td>LKR {Number(r.roomPrice).toLocaleString()}</td>
                    <td>
                      <span
                        className={
                          r.status === "Available"
                            ? "badge-avail"
                            : "badge-booked"
                        }
                      >
                        {r.status}
                      </span>
                    </td>
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
              <label>Room Number</label>
              <input
                type="text"
                value={form.roomNumber}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, roomNumber: e.target.value }))
                }
              />
              <label>Room Type</label>
              <select
                value={form.roomType}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, roomType: e.target.value }))
                }
              >
                <option>Single</option>
                <option>Double</option>
                <option>Suite</option>
                <option>Deluxe</option>
              </select>
              <label>Capacity</label>
              <input
                type="number"
                value={form.capacity}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    capacity: Number(e.target.value),
                  }))
                }
              />
              <label>Price</label>
              <input
                type="number"
                value={form.roomPrice}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, roomPrice: e.target.value }))
                }
              />
              <label>Amenities (comma separated)</label>
              <input
                type="text"
                value={form.amenities}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, amenities: e.target.value }))
                }
              />
              <label>Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value }))
                }
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Cleaning</option>
                <option>Maintenance</option>
              </select>
              <button
                type="button"
                className="btn-blue"
                style={{ marginTop: 12 }}
                onClick={saveRoom}
              >
                {editingRoomId ? "Update Room" : "Create Room"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminRooms;
