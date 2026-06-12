// src/WelcomeBotModal.js
import React from "react";
import "./WelcomeBotModal.css";

export default function WelcomeBotModal({ isOpen, username, onClose, onStartChat }) {
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
            <h3 className="welcome-bot-title">Hello {username}!</h3>
            <p className="welcome-bot-text">
              Welcome to our online hotel room booking website.<br />
              You can ask anything from me.
            </p>
          </div>
          
          <button 
            className="welcome-bot-btn" 
            onClick={onStartChat}
          >
            💬 Ask me anything
          </button>
        </div>
      </div>
    </div>
  );
}
