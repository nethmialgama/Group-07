// src/Contact.js
import React, { useState } from "react";
import { showToast } from "./toast";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSending, setIsSending] = useState(false);

  const updateField = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.message.trim()
    ) {
      showToast("Please fill in full name, email and message.", "warning");
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch("http://localhost:5000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      showToast("Message sent. We will respond within 24 hours.", "success");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      showToast(err.message || "Failed to send message", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-container">
      <div className="contact-header">
        <h1>Contact Us</h1>
        <p>
          We’d love to hear from you! Reach out with any questions or feedback.
        </p>
      </div>

      <div className="contact-layout">
        {/* LEFT COLUMN */}
        <div className="contact-left">
          {/* Card 1: Address & Follow Us */}
          <div className="contact-card address-card">
            <div className="icon-text-block">
              {/* Building Icon */}
              <div className="icon-grey">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                  <line x1="9" y1="2" x2="9" y2="22"></line>
                  <line x1="15" y1="2" x2="15" y2="22"></line>
                  <line x1="4" y1="12" x2="20" y2="12"></line>
                  <line x1="4" y1="7" x2="20" y2="7"></line>
                  <line x1="4" y1="17" x2="20" y2="17"></line>
                </svg>
              </div>
              <div className="address-text">
                <p>Smart Hotel, Galle Road, Colombo,</p>
                <p>Colombo, Sri Lanka</p>
              </div>
            </div>

            <div className="follow-us-row">
              <span>Follow Us</span>
              <div className="social-icons">
                {/* Facebook Icon */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#1877F2"
                  stroke="none"
                >
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                {/* Twitter Icon */}
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="#1DA1F2"
                  stroke="none"
                >
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: Contact Info */}
          <div className="contact-card info-card">
            <div className="info-row">
              <svg
                className="icon-grey-small"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>+94 771234567</span>
            </div>
            <div className="info-row">
              <svg
                className="icon-grey-small"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
              {/* Using edit icon as placeholder for mail/text in image, or mail icon */}
              <span>smarthotel@gmail.com</span>
            </div>
            <div className="info-row">
              <svg
                className="icon-grey-small"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>Mon–Sun, 8 AM – 10 PM</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="contact-right">
          {/* Message Form */}
          <div className="contact-card form-card">
            <h3>Send Us a Message</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => updateField("subject", e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Message</label>
                <textarea
                  rows="3"
                  value={formData.message}
                  onChange={(e) => updateField("message", e.target.value)}
                ></textarea>
              </div>

              <div style={{ textAlign: "center", marginTop: "20px" }}>
                <button
                  type="submit"
                  className="btn-blue"
                  style={{ width: "auto", padding: "10px 30px" }}
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send Message"}
                </button>
                <p className="form-note">We'll respond within 24 hours</p>
              </div>
            </form>
          </div>

          {/* Map Container - Colombo, Sri Lanka */}
          <div className="map-container">
            <iframe
              title="Colombo Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63371.803855953786!2d79.82118585!3d6.92183865!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae253d10f7a7003%3A0x320b2e4d32d3838d!2sColombo%2C%20Sri%20Lanka!5e0!3m2!1sen!2suk!4v1646834567890!5m2!1sen!2suk"
              width="100%"
              height="300"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
