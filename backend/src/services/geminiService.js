const { GoogleGenAI } = require("@google/genai");
const db = require("../db");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const handleChat = async (message) => {
  // 1️⃣ Detect intent
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Classify this request:\n\n"${message}"\n\nReturn ONLY JSON:\n{\n  "intent": "price_check | cheapest_room | availability",\n  "days": number,\n  "people": number,\n  "roomType": "Single | Double | Family | Suite"\n}`,
  });

  let text = response.text;
  // Remove Markdown code fences if present
  text = text.replace(/```json|```/gi, "").trim();

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return "Please ask clearly (example: 2 days single room price)";
  }

  // Normalize roomType for DB
  if (data.roomType) {
    let rt = data.roomType.toLowerCase();
    if (rt === "single") data.roomType = "Single";
    else if (rt === "double") data.roomType = "Double";
    else if (rt === "family") data.roomType = "Family";
    else if (rt === "suite") data.roomType = "Suite";
  }

  // 2️⃣ PRICE CHECK
  if (data.intent === "price_check") {
    const [rows] = await db.query(
      "SELECT roomPrice FROM Room WHERE roomType = ? LIMIT 1",
      [data.roomType],
    );

    if (!rows.length) return "Room type not found.";

    let total = rows[0].roomPrice * data.days;

    // Apply offer
    const [offers] = await db.query(
      `
      SELECT * FROM Offer 
      WHERE is_active = TRUE 
      AND (applicable_room_type = ? OR applicable_room_type IS NULL)
      AND CURDATE() BETWEEN start_date AND end_date
    `,
      [data.roomType],
    );

    if (offers.length && offers[0].discount_percent) {
      total -= (total * offers[0].discount_percent) / 100;
    }

    return `Total price is $${total}`;
  }
  // 0️⃣ Friendly greetings and small talk
  const greetings = [
    /\bhi\b/i,
    /\bhello\b/i,
    /\bhey\b/i,
    /\bgood morning\b/i,
    /\bgood afternoon\b/i,
    /\bgood evening\b/i,
  ];
  const thanks = [
    /\bthank(s| you)?\b/i,
    /\bthanks a lot\b/i,
    /\bappreciate\b/i,
  ];
  const bye = [/\bbye\b/i, /\bgoodbye\b/i, /\bsee you\b/i];

  if (greetings.some((r) => r.test(message))) {
    return "Hi! How can I help you today? If you want to check room prices, availability, or make a booking, just ask!";
  }
  if (thanks.some((r) => r.test(message))) {
    return "You're welcome! If you have any more questions or need help with a booking, just let me know.";
  }
  if (bye.some((r) => r.test(message))) {
    return "Goodbye! Have a wonderful day. If you need anything else, just say hi.";
  }

  // 3️⃣ CHEAPEST ROOM
  if (data.intent === "cheapest_room") {
    const [rooms] = await db.query(`
      SELECT roomType, MIN(roomPrice) as price 
      FROM Room 
      WHERE status = 'Available'
      GROUP BY roomType
      ORDER BY price ASC
      LIMIT 1
    `);

    return `Cheapest room is ${rooms[0].roomType} at $${rooms[0].price}/day`;
  }

  // 4️⃣ AVAILABILITY
  if (data.intent === "availability") {
    const [rooms] = await db.query(`
      SELECT COUNT(*) as count FROM Room WHERE status = 'Available'
    `);

    return `We have ${rooms[0].count} rooms available`;
  }

  return "I didn't understand your request.";
};

module.exports = { handleChat };
