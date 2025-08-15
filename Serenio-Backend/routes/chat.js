// routes/chat.js
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const ChatLog = require('../models/chatlog');
const { OpenAI } = require('openai');
require('dotenv').config(); // Load env variables

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * POST /api/chat
 * Body: { message: "Hi, I feel anxious" }
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });

    // 🔮 GPT-4o response from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a supportive and non-judgmental mental health assistant. Be empathetic, concise, and safe in your responses."
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    const aiResponse = completion.choices[0].message.content.trim();

    // Optional: basic placeholder sentiment for now
    const sentiment = 'neutral';

    // Save to MongoDB
    const log = await ChatLog.create({
      userId: req.user.userId,
      message,
      response: aiResponse,
      sentiment
    });

    res.status(200).json({
      response: aiResponse,
      sentiment,
      logId: log._id
    });

  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
