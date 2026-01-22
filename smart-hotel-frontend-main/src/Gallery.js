// src/Gallery.js
import React, { useState } from 'react';

function Gallery({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('rooms');
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // Updated Image Data with FIXED links
  const galleryData = {
    rooms: [
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80"
    ],
    dining: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80", 
      // FIXED IMAGE BELOW (Delicious Food Spread)
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1544148103-0773bf10d330?auto=format&fit=crop&w=800&q=80"
    ],
    surroundings: [
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", 
      // FIXED IMAGE BELOW (Luxury Pool View)
      "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=800&q=80"
    ],
    events: [
      "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80", 
      "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=800&q=80"
    ]
  };

  const currentImages = galleryData[activeTab];

  // Helper functions for lightbox navigation
  const nextImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev + 1) % currentImages.length);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    setLightboxIndex((prev) => (prev - 1 + currentImages.length) % currentImages.length);
  };

  return (
    <div className="page-container">
      <div className="gallery-header">
        <h1>Photo Gallery</h1>
        <p>Explore the beauty and comfort of Smart Hotel.</p>
      </div>

      <div className="gallery-tabs">
        {['rooms', 'dining', 'surroundings', 'events'].map(tab => (
           <button 
             key={tab}
             className={activeTab === tab ? 'active' : ''} 
             onClick={() => setActiveTab(tab)}
           >
             {tab.charAt(0).toUpperCase() + tab.slice(1)}
           </button>
        ))}
      </div>

      <div className="gallery-grid fade-in">
        {currentImages.map((imgSrc, index) => (
          <div key={index} className="gallery-item" onClick={() => setLightboxIndex(index)}>
            <img src={imgSrc} alt={`${activeTab} ${index + 1}`} />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={() => setLightboxIndex(null)}>
           <button className="lightbox-close">✕</button>
           <button className="lightbox-arrow left" onClick={prevImage}>❮</button>
           <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <img src={currentImages[lightboxIndex]} alt="Full View" />
           </div>
           <button className="lightbox-arrow right" onClick={nextImage}>❯</button>
        </div>
      )}

      <div className="gallery-cta">
        <p>Loved what you see? Book your stay now!</p>
        <button className="btn-book-now" onClick={() => onNavigate('booking')}>Book Now</button>
      </div>
    </div>
  );
}

export default Gallery;