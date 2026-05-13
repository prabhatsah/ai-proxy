const express = require("express");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Gemini proxy running");
});

app.post("/ask", async (req, res) => {
  try {
    // API key from header
    const apiKey = req.headers["x-gemini-api-key"];

    // Prompt from body
    const { prompt } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "Missing x-gemini-api-key header",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "prompt is required",
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const result = await model.generateContent(prompt);

    const response = result.response.text();

    res.json({
      success: true,
      response,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
