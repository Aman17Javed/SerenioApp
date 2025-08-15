const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/log', authenticateToken, moodController.logMood);

module.exports = router;