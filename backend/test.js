const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function test() {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
    });

    const result = await model.generateContent("Hello");

    const text = result.response.text();

    console.log(text);
  } catch (err) {
    console.error("ERROR:", err.message);
  }
}

test();
