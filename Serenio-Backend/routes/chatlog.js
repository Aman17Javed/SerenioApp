const express = require('express');
const router = express.Router();
const ChatLog = require('../models/chatlog');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const logs = await ChatLog.find({ sessionId: req.params.sessionId, userId: req.user.userId });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat logs', error: error.message });
  }
});

router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await ChatLog.distinct('sessionId', { userId: req.user.userId });
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sessions', error: error.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { sessionId, message, response } = req.body;
    const chatLog = new ChatLog({
      userId: req.user.userId,
      sessionId,
      message,
      response: response || "", // Allow empty response initially
      createdAt: new Date(),
    });
    await chatLog.save();
    res.status(201).json({ message: 'Log saved', response: response || "" });
  } catch (error) {
    res.status(500).json({ message: 'Error saving chat log', error: error.message });
  }
});

router.patch('/:sessionId/last', authenticateToken, async (req, res) => {
  try {
    const { response } = req.body;
    const lastLog = await ChatLog.findOneAndUpdate(
      { sessionId: req.params.sessionId, userId: req.user.userId },
      { response },
      { sort: { createdAt: -1 }, new: true }
    );
    if (!lastLog) throw new Error("No chat log found to update");
    res.status(200).json(lastLog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating chat log', error: error.message });
  }
});

module.exports = router;