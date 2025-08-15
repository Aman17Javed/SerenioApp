const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const Psychologist = require("../models/psychologist");
const Appointment = require("../models/appointment");
const User = require("../models/user");
const ChatLog = require("../models/chatlog");
const multer = require("multer");
const path = require("path");

const storage = multer.diskStorage({
  destination: "./uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// Get psychologist's appointments
router.get("/psychologists/appointments", verifyToken, async (req, res) => {
  try {
    const { psychologistId } = req.query;
    const appointments = await Appointment.find({ psychologistId })
      .populate('userId', 'name email')
      .populate('psychologistId', 'name specialization')
      .sort({ date: 1, timeSlot: 1 });
    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// Get psychologist's clients
router.get("/psychologists/clients", verifyToken, async (req, res) => {
  try {
    const { psychologistId } = req.query;
    
    // Get unique clients who have appointments with this psychologist
    const appointments = await Appointment.find({ psychologistId })
      .populate('userId', 'name email')
      .distinct('userId');
    
    // Get client analytics
    const clients = await Promise.all(
      appointments.map(async (userId) => {
        const user = await User.findById(userId).select('name email');
        const userAppointments = await Appointment.find({ 
          psychologistId, 
          userId 
        }).sort({ date: -1 });
        
        const lastSession = userAppointments[0]?.date || null;
        
        // Get mood data for this client
        const moodLogs = await ChatLog.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5);
        
        const moodTrend = moodLogs.map(log => {
          if (log.sentiment === 'positive') return 5;
          if (log.sentiment === 'neutral') return 3;
          return 1;
        });
        
        // Calculate overall sentiment
        const positiveCount = moodLogs.filter(log => log.sentiment === 'positive').length;
        const negativeCount = moodLogs.filter(log => log.sentiment === 'negative').length;
        let sentiment = 'Neutral';
        if (positiveCount > negativeCount) sentiment = 'Positive';
        else if (negativeCount > positiveCount) sentiment = 'Negative';
        
        return {
          _id: userId,
          name: user?.name || 'Unknown',
          email: user?.email || 'Unknown',
          lastSession,
          moodTrend,
          sentiment,
          totalAppointments: userAppointments.length
        };
      })
    );
    
    res.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    res.status(500).json({ message: "Failed to fetch clients" });
  }
});

// Get psychologist's availability
router.get("/psychologists/my-availability", verifyToken, async (req, res) => {
  try {
    const psychologistId = req.user.userId;
    const psychologist = await Psychologist.findOne({ userId: psychologistId });
    
    if (!psychologist) {
      return res.status(404).json({ message: "Psychologist not found" });
    }
    
    // For now, return a simple availability array
    // In a real app, this would be more sophisticated
    const availability = psychologist.availability || [];
    
    res.json({ dates: availability });
  } catch (error) {
    console.error("Error fetching availability:", error);
    res.status(500).json({ message: "Failed to fetch availability" });
  }
});

// Toggle availability
router.put("/psychologists/toggle-availability", verifyToken, async (req, res) => {
  try {
    const { date } = req.body;
    const psychologistId = req.user.userId;
    
    const psychologist = await Psychologist.findOne({ userId: psychologistId });
    if (!psychologist) {
      return res.status(404).json({ message: "Psychologist not found" });
    }
    
    // Toggle the date in availability
    const availability = psychologist.availability || [];
    const dateIndex = availability.indexOf(date);
    
    if (dateIndex > -1) {
      availability.splice(dateIndex, 1);
    } else {
      availability.push(date);
    }
    
    psychologist.availability = availability;
    await psychologist.save();
    
    res.json({ dates: availability });
  } catch (error) {
    console.error("Error toggling availability:", error);
    res.status(500).json({ message: "Failed to toggle availability" });
  }
});

// Get psychologist's stats
router.get("/psychologists/stats", verifyToken, async (req, res) => {
  try {
    const psychologistId = req.user.userId;
    console.log("📊 Fetching stats for psychologist:", psychologistId);
    
    // Get appointments for this specific psychologist only
    const appointments = await Appointment.find({ psychologistId });
    console.log("📋 Found appointments:", appointments.length);
    
    // Get psychologist profile to get hourly rate
    const psychologist = await Psychologist.findOne({ userId: psychologistId });
    const hourlyRate = psychologist?.hourlyRate || 2000;
    
    // Calculate real weekly bookings based on recent appointments
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
    
    const bookings = [
      { 
        week: "Week 1", 
        bookings: appointments.filter(a => new Date(a.date) >= oneWeekAgo).length 
      },
      { 
        week: "Week 2", 
        bookings: appointments.filter(a => new Date(a.date) >= twoWeeksAgo && new Date(a.date) < oneWeekAgo).length 
      },
      { 
        week: "Week 3", 
        bookings: appointments.filter(a => new Date(a.date) >= threeWeeksAgo && new Date(a.date) < twoWeeksAgo).length 
      },
      { 
        week: "Week 4", 
        bookings: appointments.filter(a => new Date(a.date) >= fourWeeksAgo && new Date(a.date) < threeWeeksAgo).length 
      }
    ];
    
    // Calculate real monthly revenue based on completed appointments
    const completedAppointments = appointments.filter(a => a.status === 'Completed');
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const revenue = [];
    for (let i = 3; i >= 0; i--) {
      const monthDate = new Date(currentYear, currentMonth - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const monthRevenue = completedAppointments.filter(a => {
        const apptDate = new Date(a.date);
        return apptDate.getMonth() === monthDate.getMonth() && apptDate.getFullYear() === monthDate.getFullYear();
      }).length * hourlyRate;
      
      revenue.push({
        month: monthName,
        revenue: monthRevenue
      });
    }
    
    // Appointment status distribution (real data)
    const statusCounts = {};
    appointments.forEach(appt => {
      statusCounts[appt.status] = (statusCounts[appt.status] || 0) + 1;
    });
    
    const status = Object.keys(statusCounts).map(key => ({
      status: key,
      value: statusCounts[key]
    }));
    
    // If no data, provide empty arrays
    if (appointments.length === 0) {
      return res.json({ 
        bookings: bookings.map(b => ({ ...b, bookings: 0 })),
        revenue: revenue.map(r => ({ ...r, revenue: 0 })),
        status: []
      });
    }
    
    console.log("📈 Returning stats - Total appointments:", appointments.length, "Revenue data:", revenue);
    res.json({ bookings, revenue, status });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
});

router.put(
  "/psychologists/profile-picture/:id",
  verifyToken,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const psychologist = await Psychologist.findById(req.params.id);
      if (
        !psychologist ||
        psychologist.userId.toString() !== req.user.userId ||
        req.user.role !== "Psychologist"
      ) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      const imageUrl = `/uploads/${req.file.filename}`;
      psychologist.imageUrl = imageUrl;
      await psychologist.save();

      res.status(200).json({ message: "Profile picture updated", imageUrl });
    } catch (err) {
      console.error("Update error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.get("/psychologists", verifyToken, async (req, res) => {
  try {
    const psychologists = await Psychologist.find().select(
      "_id name specialization rating reviews experience availability imageUrl hourlyRate sessionPrice bio"
    );
    console.log("Psychologists returned:", JSON.stringify(psychologists, null, 2));
    res.status(200).json(psychologists);
  } catch (err) {
    console.error("Error fetching psychologists:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;