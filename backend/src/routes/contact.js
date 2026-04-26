const express = require("express");
const nodemailer = require("nodemailer");
const pool = require("../db");

const router = express.Router();

const BUSINESS_EMAIL = "smarthotellk@gmail.com";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  const { name, email, subject, message } = req.body;

  const cleanName = String(name || "").trim();
  const cleanEmail = String(email || "").trim();
  const cleanSubject = String(subject || "").trim();
  const cleanMessage = String(message || "").trim();

  if (!cleanName || !cleanEmail || !cleanMessage) {
    return res
      .status(400)
      .json({ error: "Full name, email and message are required" });
  }

  try {
    await pool.query(
      "INSERT INTO Contact (name, email, subject, message, status) VALUES (?, ?, ?, ?, 'New')",
      [cleanName, cleanEmail, cleanSubject || null, cleanMessage],
    );

    const safeHtml = cleanMessage
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\n/g, "<br />");

    await transporter.sendMail({
      from: `"Smart Hotel Website" <${process.env.EMAIL_USER}>`,
      to: BUSINESS_EMAIL,
      replyTo: cleanEmail,
      subject: `[Website Contact] ${cleanSubject || "New message"}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:680px;margin:0 auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
          <div style="background:#1a3c5e;color:#fff;padding:18px 22px;font-size:18px;font-weight:700;">New Contact Message</div>
          <div style="padding:18px 22px;color:#1f2937;line-height:1.55;">
            <p style="margin:0 0 12px;"><strong>Name:</strong> ${cleanName}</p>
            <p style="margin:0 0 12px;"><strong>Email:</strong> ${cleanEmail}</p>
            <p style="margin:0 0 12px;"><strong>Subject:</strong> ${cleanSubject || "-"}</p>
            <p style="margin:0 0 8px;"><strong>Message:</strong></p>
            <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:6px;">${safeHtml}</div>
          </div>
        </div>
      `,
      text: `New Contact Message\n\nName: ${cleanName}\nEmail: ${cleanEmail}\nSubject: ${cleanSubject || "-"}\n\nMessage:\n${cleanMessage}`,
    });

    return res.json({ success: true, message: "Message sent successfully" });
  } catch (err) {
    console.error("Contact submit error:", err);
    return res.status(500).json({ error: "Failed to send your message" });
  }
});

module.exports = router;
