
const { GoogleGenAI } = require("@google/genai");
const db = require("../db");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});


const handleChat = async (message) => {
  // 1️⃣ Detect intent
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Classify this request:\n\n"${message}"\n\nReturn ONLY JSON:\n{\n  "intent": "price_check | cheapest_room | availability",\n  "days": number,\n  "people": number,\n  "roomType": "Single | Double | Family | Suite"\n}`
  });

  const text = response.text;

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
