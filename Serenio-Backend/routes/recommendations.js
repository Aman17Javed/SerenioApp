const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const ChatLog = require('../models/chatlog');
const Recommendation = require('../models/recommendation');

const resources = {
  NEGATIVE: [
    'Try mindfulness exercises: https://www.mindful.org/meditation',
    'Consider journaling your thoughts: https://www.psychologytoday.com/journaling'
  ],
  POSITIVE: ['Keep it up! Explore more activities: https://www.happify.com'],
  neutral: ['Learn about mental health: https://www.nami.org']
};

router.get('/session/:sessionId', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const chatLogs = await ChatLog.find({ sessionId, userId: req.user.userId });
    if (!chatLogs.length) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const sentiments = chatLogs.map(log => log.sentiment.toUpperCase());
    const dominantSentiment = sentiments.reduce((a, b, _, arr) =>
      arr.filter(x => x === a).length > arr.filter(x => x === b).length ? a : b
    );

    const recommendation = new Recommendation({
      userId: req.user.userId,
      sessionId,
      recommendation: resources[dominantSentiment][0]
    });
    await recommendation.save();

    res.json({ recommendation: recommendation.recommendation });
  } catch (error) {
    console.error('Recommendation error:', error.message);
    res.status(500).json({ error: 'Failed to generate recommendation' });
  }
});

module.exports = router;