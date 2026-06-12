import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

const getRoomImage = (roomType = "", idx = 0) => {
  const normalized = String(roomType).trim().toLowerCase();
  if (normalized.includes("single")) {
    const singleImages = ["/images/single1.png", "/images/single2.png"];
    return singleImages[idx % singleImages.length];
  }
  if (normalized.includes("double")) {
    const doubleImages = ["/images/double1.png", "/images/double2.png", "/images/double3.png"];
    return doubleImages[idx % doubleImages.length];
  }
  if (normalized.includes("trible") || normalized.includes("triple") || normalized.includes("family")) {
    const tribleImages = ["/images/trible1.png", "/images/trible2.png"];
    return tribleImages[idx % tribleImages.length];
  }
  return "/images/single1.png";
};

export default function Chatbot({
  onNavigate,
  setSelectedRoom,
  setRoomSearchCriteria,
  open: controlledOpen,
  setOpen: controlledSetOpen,
}) {
  const [localOpen, setLocalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : localOpen;
  const setOpen = controlledSetOpen !== undefined ? controlledSetOpen : setLocalOpen;
  const [sessionId] = useState(() => {
    let id = localStorage.getItem("chat_session_id");
    if (!id) {
      id = Math.random().toString(36).substring(7);
      localStorage.setItem("chat_session_id", id);
    }
    return id;
  });
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I am the hotel AI assistant. How can I help you?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (open && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          history: messages,
          sessionId: sessionId 
        }),
      });
      const data = await res.json();
      
      setMessages((msgs) => [...msgs, { from: "bot", text: data.reply }]);

      // Handle Redirection for Booking
      if (data.redirect === "/booking" && data.bookingDetails) {
        const { checkIn, checkOut, roomType, guests } = data.bookingDetails;
        
        // Determine capacity based on guests or room type
        const capacityMap = { "single": 1, "double": 2, "triple": 3, "family": 3 };
        const capacity = guests || capacityMap[roomType.toLowerCase()] || 2;
        
        try {
          // Fetch real available rooms for these dates
          const roomRes = await fetch(`http://localhost:5000/api/rooms?checkIn=${checkIn}&checkOut=${checkOut}&capacity=${capacity}`);
          const availableRooms = await roomRes.json();
          
          // Find a room that matches the requested type
          const matchingRoom = availableRooms.find(r => 
            r.roomType.toLowerCase().includes(roomType.toLowerCase()) || 
            roomType.toLowerCase().includes(r.roomType.toLowerCase())
          );

          if (matchingRoom) {
            setTimeout(() => {
              // 1. Set the search criteria (this also syncs home inputs via App.js callback)
              setRoomSearchCriteria({
                checkIn,
                checkOut,
                guestSelection: capacity === 1 ? "1-adult" : (capacity === 2 ? "2-adults" : "2-adults-1-kid"),
                capacity: capacity
              });
              
              // 2. Set the actual available room details
              setSelectedRoom({
                roomId: matchingRoom.roomId,
                title: `${matchingRoom.roomType} Room`,
                price: matchingRoom.roomPrice, 
                image: getRoomImage(matchingRoom.roomType, matchingRoom.roomId),
                tags: (matchingRoom.amenities || "Wi-Fi, AC").split(",").map(t => t.trim()),
                capacity: matchingRoom.capacity,
                rating: 4.5
              });

              // 3. Navigate to booking page
              onNavigate("booking");
            }, 1000);
          } else {
            // Room not available for these dates
            setMessages((msgs) => [...msgs, { 
              from: "bot", 
              text: `I checked our system, and unfortunately, no ${roomType} rooms are available from ${checkIn} to ${checkOut}. Would you like to check other dates or a different room type?` 
            }]);
          }
        } catch (err) {
          console.error("Redirection error:", err);
          // Fallback: just set criteria and show rooms page if something goes wrong
          setRoomSearchCriteria({ checkIn, checkOut, capacity });
          onNavigate("rooms");
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((msgs) => [
        ...msgs,
        { from: "bot", text: "Sorry, I couldn't connect to the AI bot." },
      ]);
    }
    setLoading(false);
  };

  return (
    <>
      {/* Floating Chatbot Button */}
      <button
        className="chatbot-fab"
        onClick={() => setOpen((o) => !o)}
        aria-label="Open chat bot"
      >
        <img src="/images/bot2.png" alt="Chatbot" />
      </button>
      {open && (
        <div className="chatbot-modal">
          <div className="chatbot-header">
            <span>AI Chatbot</span>
            <button className="chatbot-close" onClick={() => setOpen(false)}>
              &times;
            </button>
          </div>
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chatbot-msg chatbot-msg-${msg.from}`}>
                {msg.text}
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chatbot-input-area" onSubmit={sendMessage}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
              autoFocus
            />
            <button type="submit" disabled={loading || !input.trim()}>
              {loading ? "..." : "Send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
