const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Feedback = require('../models/feedback');
const ChatLog = require('../models/chatlog');

router.post('/submit', authenticateToken, async (req, res) => {
  try {
    const { sessionId, messageId, rating, comment } = req.body;
    if (!sessionId || !messageId || !rating) {
      return res.status(400).json({ error: 'sessionId, messageId, and rating are required' });
    }

    const chatLog = await ChatLog.findOne({ _id: messageId, sessionId, userId: req.user.userId });
    if (!chatLog) {
      return res.status(404).json({ error: 'Chat log not found' });
    }

    const feedback = new Feedback({
      userId: req.user.userId,
      sessionId,
      messageId,
      rating,
      comment
    });
    await feedback.save();

    res.json({ message: 'Feedback submitted', feedbackId: feedback._id });
  } catch (error) {
    console.error('Feedback error:', error.message);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

module.exports = router;