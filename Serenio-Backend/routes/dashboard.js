const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

router.get('/mood/stats', authenticateToken, dashboardController.getMoodStats);
router.get('/activity/recent', authenticateToken, dashboardController.getRecentActivity);
router.get('/psychologists/top', authenticateToken, dashboardController.getTopPsychologists);
router.get('/sessions/insights', authenticateToken, dashboardController.getSessionInsights);

// New comprehensive dashboard endpoints
router.get('/user/stats', authenticateToken, dashboardController.getUserStats);
router.get('/mood/trends', authenticateToken, dashboardController.getMoodTrends);
router.get('/sessions/analytics', authenticateToken, dashboardController.getSessionAnalytics);
router.get('/wellness/insights', authenticateToken, dashboardController.getWellnessInsights);
router.get('/user/reports', authenticateToken, dashboardController.getUserReports);

module.exports = router;