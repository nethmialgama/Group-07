import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";

export default function Chatbot({ onNavigate, setSelectedRoom, setRoomSearchCriteria }) {
  const [open, setOpen] = useState(false);
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
        setTimeout(() => {
          // 1. Set the search criteria
          setRoomSearchCriteria({
            checkIn: data.bookingDetails.checkIn,
            checkOut: data.bookingDetails.checkOut,
            guestSelection: "2-adults"
          });
          
          // 2. Try to find room info or use a placeholder
          setSelectedRoom({
            roomId: 1, // Default or parsed from data
            title: `${data.bookingDetails.roomType} Room`,
            price: "5000", 
            image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80",
            tags: ["Wi-Fi", "AC"]
          });

          // 3. Navigate
          onNavigate("booking");
        }, 1500);
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
        <span role="img" aria-label="chatbot">
          💬
        </span>
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
