// src/App.js
import React, { useState, useEffect } from "react";
import "./App.css";
import { motion, AnimatePresence } from "framer-motion";
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
import Chatbot from "./Chatbot";

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

const getRoomImage = (roomType = "", idx = 0) => {
  const normalized = String(roomType).trim().toLowerCase();

  if (normalized.includes("single")) {
    const singleImages = ["/images/single1.png", "/images/single2.png"];
    return singleImages[idx % singleImages.length];
  }
  if (normalized.includes("double")) {
    const doubleImages = [
      "/images/double1.png",
      "/images/double2.png",
      "/images/double3.png",
    ];
    return doubleImages[idx % doubleImages.length];
  }
  if (normalized.includes("trible") || normalized.includes("triple")) {
    const tribleImages = ["/images/trible1.png", "/images/trible2.png"];
    return tribleImages[idx % tribleImages.length];
  }
  return "/images/single1.png";
};

function App() {
  // 1. Initialize State
  const [currentPage, setCurrentPage] = useState(() => {
    if (window.location.pathname.includes("reset-password")) {
      return "reset-password";
    }
    return window.location.hash.replace("#", "") || "home";
  });

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [postLoginTarget, setPostLoginTarget] = useState(null);

  const initialAuth = getStoredAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(!!initialAuth.token);
  const [role, setRole] = useState(initialAuth.role || "");
  const [selectedAdminUser, setSelectedAdminUser] = useState(null);
  const [featuredRooms, setFeaturedRooms] = useState([]);
  const [roomSearchCriteria, setRoomSearchCriteria] = useState(() => {
    const saved = localStorage.getItem("hotelSearchCriteria");
    return saved ? JSON.parse(saved) : null;
  });

  const [homeCheckIn, setHomeCheckIn] = useState(
    roomSearchCriteria?.checkIn || "",
  );
  const [homeCheckOut, setHomeCheckOut] = useState(
    roomSearchCriteria?.checkOut || "",
  );
  const [homeGuests, setHomeGuests] = useState(
    roomSearchCriteria?.guestSelection || "2-adults",
  );

  const todayIso = new Date().toISOString().split("T")[0];

  const guestSelectionToCapacity = (selection) => {
    if (selection === "1-adult") return 1;
    if (selection === "2-adults") return 2;
    if (selection === "2-adults-1-kid") return 3;
    return 2;
  };

  const heroImages = [
    "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1920&q=80",
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1920&q=80"
  ];
  const [heroIndex, setHeroIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleHomeSearch = () => {
    if (!homeCheckIn || !homeCheckOut) {
      showToast("Please select check-in and check-out dates.", "warning");
      return;
    }
    if (homeCheckIn < todayIso) {
      showToast("Past dates are not allowed for check-in.", "warning");
      return;
    }
    if (homeCheckOut <= homeCheckIn) {
      showToast("Check-out date must be after check-in.", "warning");
      return;
    }

    const nights = Math.ceil(
      (new Date(homeCheckOut) - new Date(homeCheckIn)) / (24 * 60 * 60 * 1000),
    );

    if (nights > 30) {
      const confirmDates = window.confirm(
        "Your stay is more than 30 days. Are you sure you want these check-in/check-out dates?",
      );
      if (!confirmDates) return;
    }

    const criteria = {
      checkIn: homeCheckIn,
      checkOut: homeCheckOut,
      capacity: guestSelectionToCapacity(homeGuests),
      guestSelection: homeGuests,
    };
    setRoomSearchCriteria(criteria);
    localStorage.setItem("hotelSearchCriteria", JSON.stringify(criteria));
    handleNavigation("rooms");
  };

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
            image: getRoomImage(room.roomType, idx),
            tags: (room.amenities || "Wi-Fi, AC")
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean),
            capacity: Number(room.capacity || 0),
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

  // 4. Auth Handlers
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
  let pageContent;

  // --- ADMIN PAGES ---
  if (currentPage === "admin-login") {
    pageContent = (
      <AdminLogin
        onNavigate={handleNavigation}
        onAdminLogin={handleUserLogin}
      />
    );
  } else if (currentPage === "admin-dashboard") {
    if (role !== "Admin")
      pageContent = (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    else
      pageContent = (
        <AdminDashboard
          onNavigate={handleNavigation}
          onLogout={handleUserLogout}
        />
      );
  } else if (currentPage === "admin-rooms") {
    if (role !== "Admin")
      pageContent = (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    else
      pageContent = (
        <AdminRooms onNavigate={handleNavigation} onLogout={handleUserLogout} />
      );
  } else if (currentPage === "admin-users") {
    if (role !== "Admin")
      pageContent = (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    else
      pageContent = (
        <AdminUsers onNavigate={handleNavigation} onLogout={handleUserLogout} />
      );
  } else if (currentPage === "admin-user-view") {
    if (role !== "Admin")
      pageContent = (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    else
      pageContent = (
        <AdminUserView
          onNavigate={handleNavigation}
          onLogout={handleUserLogout}
          user={selectedAdminUser}
        />
      );
  } else if (currentPage === "admin-payments") {
    if (role !== "Admin")
      pageContent = (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    else
      pageContent = (
        <AdminPaymentSettings
          onNavigate={handleNavigation}
          onLogout={handleUserLogout}
        />
      );
  } else if (currentPage === "admin-refunds") {
    if (role !== "Admin")
      pageContent = (
        <AdminLogin
          onNavigate={handleNavigation}
          onAdminLogin={handleUserLogin}
        />
      );
    else
      pageContent = (
        <AdminRefunds onNavigate={handleNavigation} onLogout={handleUserLogout} />
      );
  } else if (currentPage === "login") {
    pageContent = (
      <Login
        onLogin={handleUserLogin}
        onBack={() => handleNavigation("home")}
        onSignupClick={() => handleNavigation("signup")}
        onForgotPassword={() => handleNavigation("forgot-password")}
      />
    );
  } else if (currentPage === "signup") {
    pageContent = (
      <Signup
        onLoginClick={() => handleNavigation("login")}
        onBack={() => handleNavigation("home")}
      />
    );
  } else if (currentPage === "forgot-password") {
    pageContent = <ForgotPassword onBack={() => handleNavigation("login")} />;
  } else if (currentPage === "reset-password") {
    pageContent = <ResetPassword onBackToLogin={() => handleNavigation("login")} />;
  } else if (currentPage === "rooms") {
    pageContent = (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Rooms
          onNavigate={handleNavigation}
          searchCriteria={roomSearchCriteria}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  } else if (currentPage === "room-details") {
    pageContent = (
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
  } else if (currentPage === "booking") {
    pageContent = (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Booking
          onNavigate={handleNavigation}
          room={selectedRoom}
          searchCriteria={roomSearchCriteria}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  } else if (currentPage === "payment") {
    pageContent = (
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
  } else if (currentPage === "payment-gateway") {
    if (!isLoggedIn)
      pageContent = (
        <Login
          onLogin={handleUserLogin}
          onBack={() => handleNavigation("home")}
          onSignupClick={() => handleNavigation("signup")}
          onForgotPassword={() => handleNavigation("forgot-password")}
        />
      );
    else pageContent = <PaymentGateway onNavigate={handleNavigation} room={selectedRoom} />;
  } else if (currentPage === "payment-confirmation") {
    if (!isLoggedIn)
      pageContent = (
        <Login
          onLogin={handleUserLogin}
          onBack={() => handleNavigation("home")}
          onSignupClick={() => handleNavigation("signup")}
          onForgotPassword={() => handleNavigation("forgot-password")}
        />
      );
    else
      pageContent = (
        <PaymentConfirmation onNavigate={handleNavigation} room={selectedRoom} />
      );
  } else if (currentPage === "dashboard") {
    pageContent = (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <Dashboard
          onNavigate={handleNavigation}
          recentBooking={selectedRoom}
          onLogout={handleUserLogout}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  } else if (currentPage === "cancel") {
    pageContent = (
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
  } else if (currentPage === "offers") {
    pageContent = (
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
  } else if (currentPage === "gallery") {
    pageContent = (
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
  } else if (currentPage === "contact") {
    pageContent = (
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
  } else if (currentPage === "profile-settings") {
    pageContent = (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />
        <ProfileSettings
          onNavigate={handleNavigation}
          onLogout={handleUserLogout}
        />
        <Footer onNavigate={handleNavigation} />
      </div>
    );
  } else if (currentPage === "reviews") {
    pageContent = (
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
  } else {
    // --- DEFAULT: HOME PAGE ---
    pageContent = (
      <div className="App">
        <Navbar
          onNavigate={handleNavigation}
          isLoggedIn={isLoggedIn}
          onLogout={handleUserLogout}
        />

        {/* Hero Section */}
        <header 
          className="hero" 
          style={{ 
            backgroundImage: `url(${heroImages[heroIndex]})`,
            transition: "background-image 1.5s ease-in-out" 
          }}
        >
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <motion.h1 
              className="hero-title"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              Find your perfect stay
            </motion.h1>
            <motion.p 
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            >
              Comfortable rooms • Great location • Best price guarantee
            </motion.p>
            
            <motion.div 
              className="tour-container"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              <button
                onClick={() => setIsTourOpen(true)}
                className="tour-btn-premium"
              >
                🎥 Take a 360° Virtual Tour
              </button>
            </motion.div>
          </div>

          <motion.div 
            className="search-bar-glass"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
          >
            <div className="search-field">
              <label>Check-in</label>
              <input
                type="date"
                min={todayIso}
                value={homeCheckIn}
                onChange={(e) => {
                  const nextCheckIn = e.target.value;
                  setHomeCheckIn(nextCheckIn);
                  if (homeCheckOut && homeCheckOut <= nextCheckIn) {
                    setHomeCheckOut("");
                  }
                }}
              />
            </div>
            <div className="search-field">
              <label>Check-out</label>
              <input
                type="date"
                min={homeCheckIn || todayIso}
                value={homeCheckOut}
                onChange={(e) => setHomeCheckOut(e.target.value)}
              />
            </div>
            <div className="search-field">
              <label>Guests</label>
              <select
                value={homeGuests}
                onChange={(e) => setHomeGuests(e.target.value)}
              >
                <option value="1-adult">1 Adult</option>
                <option value="2-adults">2 Adults</option>
                <option value="2-adults-1-kid">2 Adults + 1 Kid</option>
              </select>
            </div>
            <button className="search-btn-gold" onClick={handleHomeSearch}>
              Search
            </button>
          </motion.div>
        </header>

        {/* Featured Rooms */}
        <section className="featured-rooms">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
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
          </motion.div>

          <div className="room-grid">
            {featuredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <RoomCard
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
                      capacity: room.capacity,
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
                      capacity: room.capacity,
                    })
                  }
                />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Virtual Tour Modal */}
        <VirtualTour isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />

        <Footer onNavigate={handleNavigation} />
      </div>
    );
  }

  return (
    <>
      {pageContent}
      <Chatbot 
        onNavigate={handleNavigation} 
        setSelectedRoom={setSelectedRoom}
        setRoomSearchCriteria={(criteria) => {
          setRoomSearchCriteria(criteria);
          // Also sync the home search inputs
          if (criteria.checkIn) setHomeCheckIn(criteria.checkIn);
          if (criteria.checkOut) setHomeCheckOut(criteria.checkOut);
          if (criteria.guestSelection) setHomeGuests(criteria.guestSelection);
        }}
      />
    </>
  );
}

// --- SHARED COMPONENTS ---

function Navbar({ onNavigate, isLoggedIn, onLogout }) {
  const role = getStoredAuth().role;

  return (
    <motion.nav 
      className="navbar"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="logo" onClick={() => onNavigate("home")}>
        <img className="brand-logo-img" src="/images/logo.png" alt="CEYLONO" />
        <span className="brand-logo-text">CEYLONO</span>
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
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("reviews");
          }}
        >
          Reviews
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
    </motion.nav>
  );
}

function Footer({ onNavigate }) {
  return (
    <motion.footer 
      className="footer"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 1 }}
    >
      <div className="footer-content">
        <div className="footer-column">
          <div className="logo" onClick={() => onNavigate("home")} style={{ marginBottom: "20px" }}>
            <span className="brand-logo-text" style={{ color: "#fff", fontSize: "1.5rem" }}>CEYLONO</span>
          </div>
          <p style={{ opacity: 0.8 }}>Your trusted partner for comfortable stays and unforgettable experiences. Discover the essence of luxury at CEYLONO.</p>
        </div>
        <div className="footer-column">
          <h4 style={{ color: "#fff", marginBottom: "20px" }}>Experience</h4>
          <p>Luxurious Comfort</p>
          <p>Exquisite Dining</p>
          <p>Spa & Wellness</p>
          <p>World Class Service</p>
        </div>
        <div className="footer-column">
          <h4 style={{ color: "#fff", marginBottom: "20px" }}>Contact Us</h4>
          <p>📞 +94 112 345 678</p>
          <p>✉️ smarthotel@gmail.com</p>
          <p>🏨 123 Hotel Road, Colombo</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2025 CEYLONO — All rights reserved.</p>
      </div>
    </motion.footer>
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
