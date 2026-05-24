const express = require("express");
const cors = require("cors");

const { GoogleGenerativeAI } = require("@google/generative-ai");
const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("AI proxy running");
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    service: "ai-proxy-server",
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post("/ask", async (req, res) => {
  try {
    // API key from header
    const apiKey = req.headers["x-api-key"];

    // Request body
    const {
      provider, // "gemini" or "openai"
      prompt,
    } = req.body;

    console.log("provider", provider);

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "Missing x-api-key header",
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: "prompt is required",
      });
    }

    if (!provider) {
      return res.status(400).json({
        success: false,
        error: "provider is required",
      });
    }

    let responseText = "";

    // =========================
    // GEMINI
    // =========================
    if (provider === "gemini") {
      const genAI = new GoogleGenerativeAI(apiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });

      const result = await model.generateContent(prompt);

      responseText = result.response.text();
    }

    // =========================
    // OPENAI
    // =========================
    else if (provider === "openai") {
      const openai = new OpenAI({
        apiKey,
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      responseText = completion.choices[0].message.content;
    }

    // =========================
    // INVALID PROVIDER
    // =========================
    else {
      return res.status(400).json({
        success: false,
        error: "Invalid provider",
      });
    }

    res.json({
      success: true,
      provider,
      response: responseText,
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
