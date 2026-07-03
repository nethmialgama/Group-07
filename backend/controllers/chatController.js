const { handleChat } = require("../src/services/geminiService");

const chatController = async (req, res) => {
  try {
    const { message, history, sessionId } = req.body;

    const result = await handleChat(message, history, sessionId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

module.exports = chatController;
