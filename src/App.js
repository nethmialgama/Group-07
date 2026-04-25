// src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import { showToast } from "./toast";

// --- IMPORT ALL PAGES ---
import Login from "./Login";
import Signup from "./Signup";
import Rooms from "./Rooms";
import RoomDetails from "./RoomDetails";
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
import AccountAvatarMenu from "./AccountAvatarMenu";
import PaymentGateway from "./PaymentGateway";
import PaymentConfirmation from "./PaymentConfirmation";

// --- ADMIN IMPORTS ---
import AdminLogin from "./AdminLogin";
import AdminDashboard from "./AdminDashboard";
import AdminRooms from "./AdminRooms";
import AdminUsers from "./AdminUsers";
import AdminUserView from "./AdminUserView";
import AdminPaymentSettings from "./AdminPaymentSettings";
import AdminRefunds from "./AdminRefunds";
import { clearStoredAuth, getStoredAuth } from "./auth";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

function App() {
  // 1. Initialize State
  const [currentPage, setCurrentPage] = useState(
    window.location.hash.replace("#", "") || "home",
  );

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [postLoginTarget, setPostLoginTarget] = useState(null);

  // NEW: Authentication State
  const initialAuth = getStoredAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialAuth.token);
  const [role, setRole] = useState(initialAuth.role || "");
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [featuredRooms, setFeaturedRooms] = useState([]);

  useEffect(() => {
    const loadFeaturedRooms = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/rooms");
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Failed to load featured rooms");
        }

        const mapped = data
          .filter((room) => room.status === "Available")
          .sort((a, b) => Number(b.roomId) - Number(a.roomId))
          .slice(0, 3)
          .map((room, idx) => ({
            id: room.roomId,
            roomId: room.roomId,
            title: `${room.roomType} Room`,
            price: `LKR ${Number(room.roomPrice || 0).toLocaleString()}`,
            rawPrice: Number(room.roomPrice || 0).toLocaleString(),
            rating: (4.2 + (idx % 4) * 0.2).toFixed(1),
            image:
              "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
            tags: (room.amenities || "Wi-Fi, AC")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
          }));

        setFeaturedRooms(mapped);
      } catch (err) {
        console.error(err);
      }
    };

    loadFeaturedRooms();
  }, []);

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
  const handleNavigation = (page, data = null, options = {}) => {
    const bypassAuthGuard = !!options.bypassAuthGuard;
    const protectedUserPages = [
      "booking",
      "payment",
      "payment-gateway",
      "payment-confirmation",
      "dashboard",
      "cancel",
      "profile-settings",
    ];
    const adminPages = [
      "admin-dashboard",
      "admin-rooms",
      "admin-users",
      "admin-user-view",
      "admin-payments",
      "admin-refunds",
    ];

    // Require authentication before entering booking flow.
    if (protectedUserPages.includes(page) && !isLoggedIn && !bypassAuthGuard) {
      setPostLoginTarget({ page, room: data });
      showToast("Please login first.", "warning");
      setCurrentPage("login");
      window.history.pushState({ page: "login" }, "", "#login");
      window.scrollTo(0, 0);
      return;
    }

    if (adminPages.includes(page) && role !== "Admin" && !bypassAuthGuard) {
      showToast("Admin access required.", "error");
      setCurrentPage("admin-login");
      window.history.pushState({ page: "admin-login" }, "", "#admin-login");
      window.scrollTo(0, 0);
      return;
    }

    setCurrentPage(page);
    if (data) {
      setSelectedRoom(data);
      if (page === "admin-user-view") {
        setSelectedAdminUser(data);
      }
    }
    window.history.pushState({ page, room: data }, "", `#${page}`);
    window.scrollTo(0, 0);
  };

  // 4. Auth Handlers (NEW)
  const handleUserLogin = (userData) => {
    const freshAuth = getStoredAuth();
    setIsLoggedIn(true);
    setRole(userData?.role || freshAuth.role || "Guest");

    if (postLoginTarget) {
      const target = postLoginTarget;
      setPostLoginTarget(null);
      handleNavigation(target.page, target.room || null, {
        bypassAuthGuard: true,
      });
      return;
    }

    if ((userData?.role || freshAuth.role) === "Admin") {
      handleNavigation("admin-dashboard", null, { bypassAuthGuard: true });
    } else {
      handleNavigation("dashboard", null, { bypassAuthGuard: true });
    }
  };

  const handleUserLogout = () => {
    clearStoredAuth();
    setIsLoggedIn(false);
    setRole("");
    handleNavigation("home");
  };

  // --- RENDER LOGIC (THE ROUTER) ---

  // --- ADMIN PAGES ---
  if (currentPage === "admin-login") {
    return (
      <AdminLogin
        onNavigate={handleNavigation}
        onAdminLogin={handleUserLogin}
      />
    );
  }
  if (currentPage === "admin-dashboard") {
    if (role !== "Admin")
      return (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    return (
      <AdminDashboard
        onNavigate={handleNavigation}
        onLogout={handleUserLogout}
      />
    );
  }
  if (currentPage === "admin-rooms") {
    if (role !== "Admin")
      return (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    return (
      <AdminRooms onNavigate={handleNavigation} onLogout={handleUserLogout} />
    );
  }
  if (currentPage === "admin-users") {
    if (role !== "Admin")
      return (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    return (
      <AdminUsers onNavigate={handleNavigation} onLogout={handleUserLogout} />
    );
  }
  if (currentPage === "admin-user-view") {
    if (role !== "Admin")
      return (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    return (
      <AdminUserView
        onNavigate={handleNavigation}
        onLogout={handleUserLogout}
        user={selectedAdminUser}
      />
    );
  }
  if (currentPage === "admin-payments") {
    if (role !== "Admin")
      return (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    return (
      <AdminPaymentSettings
        onNavigate={handleNavigation}
        onLogout={handleUserLogout}
      />
    );
  }
  if (currentPage === "admin-refunds") {
    if (role !== "Admin")
      return (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    return (
      <AdminRefunds onNavigate={handleNavigation} onLogout={handleUserLogout} />
    );
  }

  // --- USER AUTH PAGES ---
  if (currentPage === "login") {
    // UPDATED: Uses handleUserLogin to set state + navigate
    return (
      <Login
        onLogin={handleUserLogin}
        onBack={() => handleNavigation("home")}
        onSignupClick={() => handleNavigation("signup")}
        onForgotPassword={() => handleNavigation("forgot-password")}
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
  if (currentPage === "forgot-password") {
    return <ForgotPassword onBack={() => handleNavigation("login")} />;
  }
  if (currentPage === "reset-password") {
    return <ResetPassword onBackToLogin={() => handleNavigation("login")} />;
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

  if (currentPage === "room-details") {
    return (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <RoomDetails onNavigate={handleNavigation} room={selectedRoom} />
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

  if (currentPage === "payment-gateway") {
    if (!isLoggedIn)
      return (
        <Login
          onLogin={handleUserLogin}
          onBack={() => handleNavigation("home")}
          onSignupClick={() => handleNavigation("signup")}
          onForgotPassword={() => handleNavigation("forgot-password")}
        />
      );
    return <PaymentGateway onNavigate={handleNavigation} room={selectedRoom} />;
  }

  if (currentPage === "payment-confirmation") {
    if (!isLoggedIn)
      return (
        <Login
          onLogin={handleUserLogin}
          onBack={() => handleNavigation("home")}
          onSignupClick={() => handleNavigation("signup")}
          onForgotPassword={() => handleNavigation("forgot-password")}
        />
      );
    return (
      <PaymentConfirmation onNavigate={handleNavigation} room={selectedRoom} />
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
        <Dashboard onNavigate={handleNavigation} recentBooking={selectedRoom} />
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
            onClick={(e) => {
              e.preventDefault();
              handleNavigation("rooms");
            }}
          >
            See all rooms
          </a>
        </div>

        <div className="room-grid">
          {featuredRooms.map((room) => (
            <RoomCard
              key={room.id}
              title={room.title}
              price={room.price}
              rating={room.rating}
              image={room.image}
              onViewDetails={() =>
                handleNavigation("room-details", {
                  roomId: room.roomId,
                  title: room.title,
                  price: room.rawPrice,
                  image: room.image,
                  rating: Number(room.rating),
                  tags: room.tags,
                })
              }
              onBook={() =>
                handleNavigation("booking", {
                  roomId: room.roomId,
                  title: room.title,
                  price: room.rawPrice,
                  image: room.image,
                  rating: Number(room.rating),
                  tags: room.tags,
                })
              }
            />
          ))}
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
  const role = getStoredAuth().role;

  return (
    <nav className="navbar">
      <div className="logo" onClick={() => onNavigate("home")}>
        Smart Hotel
      </div>
      <div className="nav-links">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("home");
          }}
        >
          Home
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("rooms");
          }}
        >
          Rooms
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("offers");
          }}
        >
          Offers
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("gallery");
          }}
        >
          Gallery
        </a>
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("contact");
          }}
        >
          Contact
        </a>
      </div>

      <div className="nav-auth">
        {isLoggedIn ? (
          <AccountAvatarMenu
            onNavigate={onNavigate}
            onLogout={onLogout}
            role={role}
          />
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

function RoomCard({ title, price, image, rating, onViewDetails, onBook }) {
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
          <button className="btn-outline" onClick={onViewDetails}>
            View Details
          </button>
          <button className="btn-fill" onClick={onBook}>
            Book Now
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
