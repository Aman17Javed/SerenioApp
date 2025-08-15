const User = require('../models/user');
const Feedback = require('../models/feedback');
const Payment = require('../models/payment');
const Appointment = require('../models/appointment');
const Psychologist = require('../models/psychologist');
const MoodLog = require('../models/moodlog');
const Recommendation = require('../models/recommendation');
const ChatLog = require('../models/chatlog');
const Transaction = require('../models/transaction');

exports.getMoodStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodHistory = await MoodLog.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 });

    const moodCounts = moodHistory.reduce(
      (acc, log) => {
        acc[log.sentiment] = (acc[log.sentiment] || 0) + 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 }
    );

    const totalMoods = moodHistory.length;
    const positivePercentage = totalMoods ? ((moodCounts.positive / totalMoods) * 100).toFixed(2) : 0;

    const status = totalMoods
      ? moodCounts.positive >= moodCounts.neutral && moodCounts.positive >= moodCounts.negative
        ? 'Positive'
        : moodCounts.neutral >= moodCounts.negative
        ? 'Neutral'
        : 'Negative'
      : 'No Data';

    res.status(200).json({
      status,
      percentage: positivePercentage,
      history: moodHistory.map((log) => ({
        date: log.createdAt.toISOString().split('T')[0],
        sentiment: log.sentiment,
      })),
    });
  } catch (error) {
    console.error('Error fetching mood stats:', error.message);
    res.status(500).json({ message: 'Error fetching mood stats', error: error.message });
}};

exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`Fetching recent activity for userId: ${userId} at ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);

    const [sessions, appointments, payments] = await Promise.all([
      ChatLog.find({ userId }).sort({ createdAt: -1 }).limit(1).lean(),
      Appointment.find({ userId }).sort({ updatedAt: -1 }).limit(1).lean(),
      Payment.find({ userId })
        .sort({ timestamp: -1 })
        .limit(1)
        .or([{ paymentStatus: 'Success' }, { paymentStatus: 'Pending' }])
        .lean(),
    ]);

    console.log('Sessions found:', sessions.length, 'Appointments found:', appointments.length, 'Payments found:', payments.length);

    const activity = [];

    if (sessions.length) {
      const sessionDate = sessions[0].createdAt instanceof Date ? sessions[0].createdAt : new Date(sessions[0].createdAt);
      if (!isNaN(sessionDate.getTime())) {
        activity.push({
          type: 'session',
          time: sessionDate.toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'short', timeStyle: 'short' }),
          sentiment: sessions[0].sentiment || 'Unknown',
        });
      } else {
        console.warn(`Invalid session date for ${sessions[0]._id}: ${sessions[0].createdAt}`);
      }
    }

    if (appointments.length) {
      const psych = await Psychologist.findById(appointments[0].psychologistId).select('name').lean();
      // Validate date (YYYY-MM-DD) and timeSlot (HH:MM)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const timeRegex = /^\d{2}:\d{2}$/;
      const isValidDate = dateRegex.test(appointments[0].date);
      const isValidTime = timeRegex.test(appointments[0].timeSlot);
      if (isValidDate && isValidTime) {
        const appointmentDateTime = new Date(`${appointments[0].date}T${appointments[0].timeSlot}:00`);
        if (!isNaN(appointmentDateTime.getTime())) {
          activity.push({
            type: 'appointment',
            time: appointmentDateTime.toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'short', timeStyle: 'short' }),
            psychologist: psych?.name || 'Unknown',
          });
        } else {
          console.warn(`Invalid appointment date/time for ${appointments[0]._id}: ${appointments[0].date} ${appointments[0].timeSlot}`);
        }
      } else {
        console.warn(`Malformed appointment date/time for ${appointments[0]._id}: date=${appointments[0].date}, timeSlot=${appointments[0].timeSlot}`);
      }
    }

    if (payments.length) {
      const paymentDate = payments[0].timestamp instanceof Date ? payments[0].timestamp : new Date(payments[0].timestamp);
      if (!isNaN(paymentDate.getTime())) {
        activity.push({
          type: 'payment',
          amount: payments[0].amount,
          status: payments[0].paymentStatus,
          time: paymentDate.toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'short', timeStyle: 'short' }),
        });
      } else {
        console.warn(`Invalid payment timestamp for ${payments[0]._id}: ${payments[0].timestamp}`);
      }
    }

    console.log('Recent activity response:', activity);
    res.json(activity);
  } catch (error) {
    console.error('Error in getRecentActivity:', error.message);
    res.status(500).json({ message: 'Error fetching recent activity', error: error.message });
  }
};

exports.getTopPsychologists = async (req, res) => {
  try {
    console.log(`Fetching top psychologists at ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);
    const psychologists = await Psychologist.find()
      .sort({ rating: -1, reviews: -1 })
      .limit(5)
      .select('name specialization rating hourlyRate');
    console.log('Top psychologists found:', psychologists.length);
    res.json(psychologists);
  } catch (error) {
    console.error('Error in getTopPsychologists:', error.message);
    res.status(500).json({ message: 'Error fetching top psychologists', error: error.message });
  }
};

exports.getSessionInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    console.log(`Fetching session insights for userId: ${userId} at ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);
    const feedback = await Feedback.find({ userId });
    const chatLogs = await ChatLog.find({ userId });
    const recommendations = await Recommendation.find({ userId }).sort({ createdAt: -1 }).limit(1);
    console.log('Feedback found:', feedback.length, 'ChatLogs found:', chatLogs.length, 'Recommendations found:', recommendations.length);

    const totalSessions = chatLogs.length;
    const averageRating = feedback.length ? (feedback.reduce((sum, f) => sum + f.rating, 0) / feedback.length).toFixed(1) : 0;
    const latestRecommendation = recommendations.length ? recommendations[0].recommendation : null;

    console.log('Session insights response:', { total: totalSessions, averageRating, latestRecommendation });
    res.json({ total: totalSessions, averageRating, latestRecommendation });
  } catch (error) {
    console.error('Error in getSessionInsights:', error.message);
    res.status(500).json({ message: 'Error fetching session insights', error: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Convert string userId to ObjectId for aggregation
    const mongoose = require('mongoose');
    const objectIdUserId = new mongoose.Types.ObjectId(userId);

    // Get comprehensive user statistics
    const [moodStats, sessionStats, appointmentStats, paymentStats] = await Promise.all([
      // Mood statistics
      MoodLog.aggregate([
        { $match: { userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$sentiment", count: { $sum: 1 } } }
      ]),
      
      // Session statistics
      ChatLog.aggregate([
        { $match: { userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$sessionId" } },
        { $count: "totalSessions" }
      ]),
      
      // Appointment statistics
      Appointment.aggregate([
        { $match: { userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      
      // Payment statistics
      Payment.aggregate([
        { $match: { userId: objectIdUserId, timestamp: { $gte: thirtyDaysAgo } } },
        { $group: { _id: null, totalAmount: { $sum: "$amount" }, totalPayments: { $sum: 1 } } }
      ])
    ]);

    // Process mood data
    const moodData = {
      positive: moodStats.find(m => m._id === 'positive')?.count || 0,
      neutral: moodStats.find(m => m._id === 'neutral')?.count || 0,
      negative: moodStats.find(m => m._id === 'negative')?.count || 0
    };

    // Process appointment data
    const appointmentData = {
      booked: appointmentStats.find(a => a._id === 'Booked')?.count || 0,
      completed: appointmentStats.find(a => a._id === 'Completed')?.count || 0,
      cancelled: appointmentStats.find(a => a._id === 'Cancelled')?.count || 0
    };

    // Process payment data
    const paymentData = {
      totalAmount: paymentStats[0]?.totalAmount || 0,
      totalPayments: paymentStats[0]?.totalPayments || 0
    };

    res.json({
      mood: moodData,
      sessions: sessionStats[0]?.totalSessions || 0,
      appointments: appointmentData,
      payments: paymentData,
      totalMoodEntries: moodData.positive + moodData.neutral + moodData.negative
    });
  } catch (error) {
    console.error('Error fetching user stats:', error.message);
    res.status(500).json({ message: 'Error fetching user statistics', error: error.message });
  }
};

exports.getMoodTrends = async (req, res) => {
  try {
    const userId = req.user.userId;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Convert string userId to ObjectId for aggregation
    const mongoose = require('mongoose');
    const objectIdUserId = new mongoose.Types.ObjectId(userId);

    const moodTrends = await MoodLog.aggregate([
      { $match: { userId: objectIdUserId, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            sentiment: "$sentiment"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Process into daily trends
    const dailyTrends = {};
    moodTrends.forEach(trend => {
      if (!dailyTrends[trend._id.date]) {
        dailyTrends[trend._id.date] = { positive: 0, neutral: 0, negative: 0 };
      }
      dailyTrends[trend._id.date][trend._id.sentiment] = trend.count;
    });

    res.json(dailyTrends);
  } catch (error) {
    console.error('Error fetching mood trends:', error.message);
    res.status(500).json({ message: 'Error fetching mood trends', error: error.message });
  }
};

exports.getSessionAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Convert string userId to ObjectId for aggregation
    const mongoose = require('mongoose');
    const objectIdUserId = new mongoose.Types.ObjectId(userId);

    const sessionAnalytics = await ChatLog.aggregate([
      { $match: { userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            sessionId: "$sessionId",
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
          },
          messageCount: { $sum: 1 },
          avgSentiment: { $avg: { $cond: [
            { $eq: ["$sentiment", "positive"] }, 1,
            { $cond: [{ $eq: ["$sentiment", "neutral"] }, 0, -1] }
          ]}}
        }
      },
      { $sort: { "_id.date": -1 } },
      { $limit: 10 }
    ]);

    res.json(sessionAnalytics);
  } catch (error) {
    console.error('Error fetching session analytics:', error.message);
    res.status(500).json({ message: 'Error fetching session analytics', error: error.message });
  }
};

exports.getWellnessInsights = async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Convert string userId to ObjectId
    const mongoose = require('mongoose');
    const objectIdUserId = new mongoose.Types.ObjectId(userId);

    // Get comprehensive wellness data
    const [moodData, sessionData, appointmentData, feedbackData] = await Promise.all([
      MoodLog.find({ userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }),
      ChatLog.find({ userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }),
      Appointment.find({ userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } }).populate('psychologistId', 'name specialization'),
      Feedback.find({ userId: objectIdUserId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 })
    ]);

    // Calculate wellness score
    const totalMoods = moodData.length;
    const positiveMoods = moodData.filter(m => m.sentiment === 'positive').length;
    const wellnessScore = totalMoods > 0 ? Math.round((positiveMoods / totalMoods) * 100) : 0;

    // Get recommendations
    const recommendations = [];
    if (wellnessScore < 50) {
      recommendations.push("Consider scheduling a session with a professional");
    }
    if (sessionData.length < 5) {
      recommendations.push("Try chatting with our AI more regularly");
    }
    if (appointmentData.length === 0) {
      recommendations.push("Book your first appointment with a psychologist");
    }

    res.json({
      wellnessScore,
      totalMoods,
      positiveMoods,
      totalSessions: sessionData.length,
      totalAppointments: appointmentData.length,
      averageRating: feedbackData.length > 0 ? 
        (feedbackData.reduce((sum, f) => sum + f.rating, 0) / feedbackData.length).toFixed(1) : 0,
      recommendations,
      recentActivity: {
        lastMood: moodData[0]?.sentiment || 'No recent mood',
        lastSession: sessionData[0]?.createdAt || null,
        lastAppointment: appointmentData[0] || null
      }
    });
  } catch (error) {
    console.error('Error fetching wellness insights:', error.message);
    res.status(500).json({ message: 'Error fetching wellness insights', error: error.message });
  }
};

exports.getUserReports = async (req, res) => {
  try {
    const userId = req.user.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get all user data for reports
    const [moodLogs, chatLogs, appointments, payments] = await Promise.all([
      MoodLog.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }),
      ChatLog.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).sort({ createdAt: -1 }),
      Appointment.find({ userId, createdAt: { $gte: thirtyDaysAgo } }).populate('psychologistId', 'name specialization').sort({ createdAt: -1 }),
      Payment.find({ userId, timestamp: { $gte: thirtyDaysAgo } }).sort({ timestamp: -1 })
    ]);

    // Generate comprehensive report
    const report = {
      period: "Last 30 Days",
      generatedAt: new Date(),
      summary: {
        totalMoodEntries: moodLogs.length,
        totalSessions: chatLogs.length,
        totalAppointments: appointments.length,
        totalPayments: payments.length,
        totalSpent: payments.reduce((sum, p) => sum + p.amount, 0)
      },
      moodAnalysis: {
        positive: moodLogs.filter(m => m.sentiment === 'positive').length,
        neutral: moodLogs.filter(m => m.sentiment === 'neutral').length,
        negative: moodLogs.filter(m => m.sentiment === 'negative').length,
        trend: moodLogs.length > 0 ? 'Improving' : 'No data'
      },
      sessionAnalysis: {
        totalMessages: chatLogs.length,
        averageMessagesPerSession: chatLogs.length > 0 ? Math.round(chatLogs.length / new Set(chatLogs.map(c => c.sessionId)).size) : 0,
        uniqueSessions: new Set(chatLogs.map(c => c.sessionId)).size
      },
      appointmentAnalysis: {
        booked: appointments.filter(a => a.status === 'Booked').length,
        completed: appointments.filter(a => a.status === 'Completed').length,
        cancelled: appointments.filter(a => a.status === 'Cancelled').length,
        upcoming: appointments.filter(a => a.status === 'Booked' && new Date(a.date) > new Date()).length
      },
      detailedData: {
        moodLogs: moodLogs.slice(0, 10), // Last 10 entries
        recentAppointments: appointments.slice(0, 5), // Last 5 appointments
        recentPayments: payments.slice(0, 5) // Last 5 payments
      }
    };

    res.json(report);
  } catch (error) {
    console.error('Error generating user report:', error.message);
    res.status(500).json({ message: 'Error generating user report', error: error.message });
  }
};