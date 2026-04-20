// src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import { showToast } from "./toast";

// --- IMPORT ALL PAGES ---
import Login from "./Login";
import Signup from "./Signup";
import Rooms from "./Rooms";
import Booking from "./Booking";
import Payment from "./Payment";
import Dashboard from "./Dashboard";
import CancelBooking from "./CancelBooking";
import Offers from "./Offers";
import Gallery from "./Gallery";
import Contact from "./Contact";
import ProfileSettings from "./ProfileSettings";
import Reviews from "./Reviews";
import VirtualTour from "./VirtualTour";

// --- ADMIN IMPORTS ---
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminRooms from "./AdminRooms";
import AdminUsers from "./AdminUsers";
import AdminUserView from "./AdminUserView";

function App() {
  // 1. Initialize State
  const [currentPage, setCurrentPage] = useState(
    window.location.hash.replace("#", "") || "home",
  );

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [postLoginTarget, setPostLoginTarget] = useState(null);

  // NEW: Authentication State
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 2. Handle Browser "Back" Button
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.room) setSelectedRoom(event.state.room);
      } else {
        const hashPage = window.location.hash.replace("#", "");
        setCurrentPage(hashPage || "home");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 3. Navigation Handler
  const handleNavigation = (page, data = null) => {
    // Require authentication before entering booking flow.
    if (page === "booking" && !isLoggedIn) {
      setPostLoginTarget({ page: "booking", room: data });
      showToast("Please login first to book a room.", "warning");
      setCurrentPage("login");
      window.history.pushState({ page: "login" }, "", "#login");
      window.scrollTo(0, 0);
      return;
    }

    setCurrentPage(page);
    if (data) {
      setSelectedRoom(data);
    }
    window.history.pushState({ page, room: data }, "", `#${page}`);
    window.scrollTo(0, 0);
  };

  // 4. Auth Handlers (NEW)
  const handleUserLogin = () => {
    setIsLoggedIn(true);

    if (postLoginTarget) {
      const target = postLoginTarget;
      setPostLoginTarget(null);
      handleNavigation(target.page, target.room || null);
      return;
    }

    handleNavigation("dashboard");
  };

  const handleUserLogout = () => {
    setIsLoggedIn(false);
    handleNavigation("home");
  };

  // --- RENDER LOGIC (THE ROUTER) ---

  // --- ADMIN PAGES ---
  if (currentPage === "admin-login") {
    return <AdminLogin onNavigate={handleNavigation} />;
  }
  if (currentPage === "admin-dashboard") {
    return <AdminDashboard onNavigate={handleNavigation} />;
  }
  if (currentPage === "admin-rooms") {
    return <AdminRooms onNavigate={handleNavigation} />;
  }
  if (currentPage === "admin-users") {
    return <AdminUsers onNavigate={handleNavigation} />;
  }
  if (currentPage === "admin-user-view") {
    return <AdminUserView onNavigate={handleNavigation} />;
  }

  // --- USER AUTH PAGES ---
  if (currentPage === "login") {
    // UPDATED: Uses handleUserLogin to set state + navigate
    return (
      <Login
        onLogin={handleUserLogin}
        onBack={() => handleNavigation("home")}
        onSignupClick={() => handleNavigation("signup")}
      />
    );
  }
  if (currentPage === "signup") {
    return (
      <Signup
        onLoginClick={() => handleNavigation("login")}
        onBack={() => handleNavigation("home")}
      />
    );
  }

  // --- MAIN HOTEL PAGES ---
  // Note: We pass isLoggedIn and onLogout to Navbar in every block below so the header stays consistent.

  if (currentPage === "rooms") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Rooms onNavigate={handleNavigation} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "booking") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Booking onNavigate={handleNavigation} room={selectedRoom} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "payment") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Payment onNavigate={handleNavigation} room={selectedRoom} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "dashboard") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        {/* UPDATED: Pass onLogout so the dashboard logout button works */}
        <Dashboard
          onNavigate={handleNavigation}
          recentBooking={selectedRoom}
          onLogout={handleUserLogout}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "cancel") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <CancelBooking onNavigate={handleNavigation} booking={selectedRoom} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "offers") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Offers onNavigate={handleNavigation} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "gallery") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Gallery onNavigate={handleNavigation} />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  // --- RESTORED MISSING ROUTES ---
  if (currentPage === "contact") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Contact />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  if (currentPage === "profile-settings") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />

        {/* UPDATED LINE BELOW: Passing props */}
        <ProfileSettings
          onNavigate={handleNavigation}
          onLogout={handleUserLogout}
        />

        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }
  if (currentPage === "reviews") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Reviews />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  // --- DEFAULT: HOME PAGE ---
  return (
    <div className="App">
      <Navbar
        onNavigate={handleNavigation}
        isLoggedIn={isLoggedIn}
        onLogout={handleUserLogout}
      />

      {/* Hero Section */}
      <header className="hero">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1>Find your perfect stay</h1>
          <p>Comfortable rooms • Great location • Best price guarantee</p>

          <button
            onClick={() => setIsTourOpen(true)}
            style={{
              marginTop: "20px",
              padding: "10px 25px",
              background: "white",
              color: "#333",
              border: "none",
              borderRadius: "30px",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
            }}
          >
            🎥 Take a 360° Virtual Tour
          </button>
        </div>

        <div className="search-bar">
          <div className="search-field">
            <label>Check-in</label>
            <input type="date" />
          </div>
          <div className="search-field">
            <label>Check-out</label>
            <input type="date" />
          </div>
          <div className="search-field">
            <label>Guests</label>
            <input type="number" placeholder="2 Adults" />
          </div>
          <button
            className="search-btn"
            onClick={() => handleNavigation("rooms")}
          >
            Search
          </button>
        </div>
      </header>

      {/* Featured Rooms */}
      <section className="featured-rooms">
        <div className="section-header">
          <h2>Featured Rooms</h2>
          <a
            href="#"
            className="see-all"
            onClick={() => handleNavigation("rooms")}
          >
            See all rooms
          </a>
        </div>

        <div className="room-grid">
          <RoomCard
            title="Deluxe Double Room"
            price="LKR 6,000"
            rating="4.6"
            image="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80"
            onBook={() =>
              handleNavigation("booking", {
                title: "Deluxe Double Room",
                price: "6,000",
                image:
                  "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
                rating: 4.6,
                tags: ["Wi-Fi", "AC"],
              })
            }
          />
          <RoomCard
            title="Superior Room"
            price="LKR 8,500"
            rating="4.3"
            image="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80"
            onBook={() =>
              handleNavigation("booking", {
                title: "Superior Room",
                price: "8,500",
                image:
                  "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80",
                rating: 4.3,
                tags: ["Wi-Fi", "AC", "Smart TV"],
              })
            }
          />
          <RoomCard
            title="Family Room"
            price="LKR 10,000"
            rating="4.7"
            image="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80"
            onBook={() =>
              handleNavigation("booking", {
                title: "Family Room",
                price: "10,000",
                image:
                  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=500&q=80",
                rating: 4.7,
                tags: ["Wi-Fi", "AC", "Dining"],
              })
            }
          />
        </div>
      </section>

      {/* Virtual Tour Modal */}
      <VirtualTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

      <Footer onNavigate={handleNavigation} />
    </div>
  );
}

// --- SHARED COMPONENTS ---

// UPDATED NAVBAR: Shows different buttons based on login status
function Navbar({ onNavigate, isLoggedIn, onLogout }) {
  return (
    <nav className="navbar">
      <div className="logo" onClick={() => onNavigate("home")}>
        Smart Hotel
      </div>
      <div className="nav-links">
        <a href="#" onClick={() => onNavigate("home")}>
          Home
        </a>
        <a href="#" onClick={() => onNavigate("rooms")}>
          Rooms
        </a>
        <a href="#" onClick={() => onNavigate("offers")}>
          Offers
        </a>
        <a href="#" onClick={() => onNavigate("gallery")}>
          Gallery
        </a>
        <a href="#" onClick={() => onNavigate("contact")}>
          Contact
        </a>
      </div>

      <div className="nav-auth">
        {isLoggedIn ? (
          // IF LOGGED IN: Show Dashboard & Logout
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span
              style={{ fontWeight: "bold", cursor: "pointer", color: "#333" }}
              onClick={() => onNavigate("dashboard")}
            >
              👤 My Dashboard
            </span>
            <button
              className="register-btn"
              style={{ backgroundColor: "#ef4444" }}
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        ) : (
          // IF LOGGED OUT: Show Login & Register
          <>
            <span className="login-link" onClick={() => onNavigate("login")}>
              Login
            </span>
            <button
              className="register-btn"
              onClick={() => onNavigate("signup")}
            >
              Register
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-column">
          <p>Your trusted partner for comfortable stays...</p>
        </div>
        <div className="footer-column">
          <p onClick={() => onNavigate("home")} style={{ cursor: "pointer" }}>
            Home
          </p>
          <p onClick={() => onNavigate("rooms")} style={{ cursor: "pointer" }}>
            Rooms
          </p>
          <p
            onClick={() => onNavigate("booking")}
            style={{ cursor: "pointer" }}
          >
            Booking
          </p>
          <p
            onClick={() => onNavigate("contact")}
            style={{ cursor: "pointer" }}
          >
            Contact
          </p>
          <p
            onClick={() => onNavigate("reviews")}
            style={{ cursor: "pointer" }}
          >
            Reviews
          </p>
          {/* Secret Admin Link */}
          <p
            onClick={() => onNavigate("admin-login")}
            style={{
              color: "#4f46e5",
              fontWeight: "bold",
              marginTop: "15px",
              cursor: "pointer",
              fontSize: "0.85rem",
            }}
          >
            Admin Login
          </p>
        </div>
        <div className="footer-column">
          <p>📞 +94 112 345 678</p>
          <p>✉️ smarthotel@gmail.com</p>
          <p>🏨 123 Hotel Road, Colombo</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 Smart Hotel — All rights reserved.</p>
      </div>
    </footer>
  );
}

function RoomCard({ title, price, image, rating, onBook }) {
  return (
    <div className="room-card">
      <img src={image} alt={title} />
      <div className="room-info">
        <h3>{title}</h3>
        <div className="amenities">
          <span>🛏️ Bed</span> <span>📶 WiFi</span> <span>🚿 AC</span>
        </div>
        <div className="price-row">
          <div className="price">
            {price} <small>/ night</small>
          </div>
          <div className="rating">⭐ {rating}</div>
        </div>
        <div className="card-buttons">
          <button className="btn-outline">View Details</button>
          <button className="btn-fill" onClick={onBook}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
