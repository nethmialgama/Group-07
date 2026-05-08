// src/VirtualTour.js
import React from 'react';

function VirtualTour({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="modal-header">
          <h2>360° Virtual Tour</h2>
          <button className="close-btn" onClick={onClose}>Close ✕</button>
        </div>

        {/* Video Player Container */}
        <div className="video-container">
           {/* Placeholder for 360 Video - replacing with a demo YouTube embed for now */}
           <iframe 
             width="100%" 
             height="450" 
             src="https://www.youtube.com/embed/Hh8sTR2CJ4k?si=1G8qH_X9wZgC_kGj" 
             title="Virtual Tour" 
             frameBorder="0" 
             allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
             allowFullScreen
           ></iframe>
        </div>
        
        <div className="modal-footer">
          <button className="btn-start-tour" onClick={() => alert("Starting VR Mode...")}>
            Start Full VR Mode
          </button>
        </div>

      </div>
    </div>
  );
}

export default VirtualTour;