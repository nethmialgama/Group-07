const { handleChat } = require("../services/geminiService");

const chatController = async (req, res) => {
  try {
    const message = req.body.message;

    const reply = await handleChat(message);

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports = chatController;
