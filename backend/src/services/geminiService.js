const { GoogleGenAI } = require("@google/genai");
const db = require("../db");
const fs = require("fs");
const path = require("path");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Ensure memory directory exists
const MEMORY_DIR = path.join(__dirname, "../../temp_memory");
if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR);

const handleChat = async (message, history = [], sessionId = "default") => {
  try {
    const memoryPath = path.join(MEMORY_DIR, `${sessionId}.json`);
    let userDetails = {};
    if (fs.existsSync(memoryPath)) {
      userDetails = JSON.parse(fs.readFileSync(memoryPath, "utf-8"));
    }

    // 1️⃣ Fetch context
    const [rooms] = await db.query('SELECT roomType, MIN(roomPrice) as minPrice FROM Room WHERE roomPrice > 0 GROUP BY roomType');
    const [availability] = await db.query('SELECT roomType, COUNT(*) as count FROM Room WHERE status = "Available" GROUP BY roomType');

    const chatHistory = history.map(m => `${m.from === 'bot' ? 'Assistant' : 'User'}: ${m.text}`).join('\n');

    const today = new Date().toISOString().split("T")[0];

    const systemPrompt = `
      You are the AI assistant for "Smart Hotel". 
      Helpful, direct, and concise.
      
      TODAY'S DATE: ${today}
      
      PERSISTENT MEMORY (from previous sessions):
      ${JSON.stringify(userDetails)}

      HOTEL INFO:
      Rooms: ${rooms.map(r => `${r.roomType}($${Math.floor(r.minPrice)})`).join(', ')}
      Availability: ${availability.map(a => `${a.roomType}: ${a.count} left`).join(', ')}

      CONVERSATION:
      ${chatHistory}
      User: ${message}

      ROOM CAPACITIES:
      - Single Bed Room: 1 Adult
      - Double Bed Room: 2 Adults
      - Family Room: 2 Adults + 1 Kid
      
      INSTRUCTIONS:
      1. If the user gives dates, room preferences, or guest count, update the memory.
      2. If a user specifies a room type (e.g., "Double Room"), assume the standard guest count for that room (e.g., 2 guests) and do NOT ask for it again unless they specifically want a different number.
      3. DATE VALIDATION: If the user suggests dates in the past (before ${today}), politely inform them that we only accept bookings for future dates. DO NOT redirect.
      4. If you have enough info (Future Dates and Room Type/Guest Count) and the user wants to book, return EXACTLY this JSON format:
         { "reply": "Great! I'm redirecting you to the booking page now.", "redirect": "/booking", "bookingDetails": { "roomType": "...", "checkIn": "...", "checkOut": "...", "guests": 2 }, "updateMemory": { ... } }
      5. Otherwise, return:
         { "reply": "...", "updateMemory": { ... } }
      
      Return ONLY the JSON.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: systemPrompt,
    });

    let result;
    try {
      let text = response.text.replace(/```json|```/gi, "").trim();
      result = JSON.parse(text);
    } catch {
      result = { reply: response.text };
    }

    // Save memory if provided
    if (result.updateMemory) {
      userDetails = { ...userDetails, ...result.updateMemory };
      fs.writeFileSync(memoryPath, JSON.stringify(userDetails));
    }

    return result;
  } catch (err) {
    console.error(err);
    return { reply: "Sorry, I'm having trouble. Please try again later." };
  }
};




module.exports = { handleChat };
