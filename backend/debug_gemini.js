const { GoogleGenAI } = require("@google/genai");
require("dotenv").config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function debug() {
  const prompt = `Classify this request:\n\n"2 days single room price"\n\nReturn ONLY JSON:\n{\n  "intent": "price_check | cheapest_room | availability",\n  "days": number,\n  "people": number,\n  "roomType": "Single | Double | Family | Suite"\n}`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  console.log("RAW OUTPUT:\n", response.text);
  try {
    const data = JSON.parse(response.text);
    console.log("\nPARSED JSON:\n", data);
  } catch (e) {
    console.log("\nJSON.parse ERROR:\n", e.message);
  }
}

debug();
