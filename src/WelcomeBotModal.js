// src/WelcomeBotModal.js
import React, { useState, useEffect } from "react";
import "./WelcomeBotModal.css";

export default function WelcomeBotModal({ isOpen, username, onClose }) {
  const [coords, setCoords] = useState({ startX: 0, startY: 0, endX: 0, endY: 0, cpX: 0, cpY: 0 });

  useEffect(() => {
    if (!isOpen) return;

    const updatePath = () => {
      const bot1El = document.querySelector(".welcome-bot-container");
      const bot2El = document.querySelector(".chatbot-fab");

      if (bot1El && bot2El) {
        const rect1 = bot1El.getBoundingClientRect();
        const rect2 = bot2El.getBoundingClientRect();

        // Start from the bottom-right area of the bot1 container
        const startX = rect1.left + rect1.width * 0.72;
        const startY = rect1.top + rect1.height * 0.65;

        // End at the top-left area of the bot2 floating chatbot button
        const endX = rect2.left + 5;
        const endY = rect2.top + 5;

        // Control point: curve to the right horizontally and then sweep downwards
        const cpX = rect2.left + rect2.width / 2;
        const cpY = startY;

        setCoords({ startX, startY, endX, endY, cpX, cpY });
      }
    };

    // Calculate coordinates after DOM renders
    const timer = setTimeout(updatePath, 150);
    window.addEventListener("resize", updatePath);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", updatePath);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="welcome-bot-overlay" onClick={onClose}>
      <div 
        className="welcome-bot-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="welcome-bot-close-btn" 
          onClick={onClose}
          aria-label="Close welcome message"
        >
          &times;
        </button>
        
        <img 
          src="/images/bot1.png" 
          alt="CEYLONO Welcome Bot" 
          className="welcome-bot-image"
        />
        
        <div className="welcome-bot-chatbox">
          <div className="welcome-bot-text-group">
            <h3 className="welcome-bot-title">hello {username} !</h3>
            <p className="welcome-bot-text">
              welcome to our online hotel room booking website.<br />
              you can ask anything from me
            </p>
          </div>
        </div>
      </div>

      {/* SVG Arrow pointing from bot1 to the bot2 chatbot fab */}
      <svg className="welcome-bot-arrow-svg">
        <defs>
          <marker 
            id="arrow-head" 
            viewBox="0 0 10 10" 
            refX="1" 
            refY="5" 
            markerWidth="7" 
            markerHeight="7" 
            orient="auto"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#c9a84c" />
          </marker>
        </defs>
        {coords.startX > 0 && (
          <path 
            d={`M ${coords.startX} ${coords.startY} Q ${coords.cpX} ${coords.cpY} ${coords.endX} ${coords.endY}`} 
            fill="none" 
            stroke="#c9a84c" 
            strokeWidth="3.5" 
            strokeDasharray="8 6" 
            markerEnd="url(#arrow-head)" 
          />
        )}
      </svg>
    </div>
  );
}
