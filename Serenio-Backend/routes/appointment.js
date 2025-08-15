
const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authMiddleware');
const Appointment = require('../models/appointment');
const User = require('../models/user');
const Psychologist = require('../models/psychologist');
const emailService = require('../services/emailService');

router.post('/book', authenticateToken, async (req, res) => {
  try {
    const { psychologistId, date, timeSlot, reason } = req.body;
    if (!psychologistId || !date || !timeSlot) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Use authenticated userId from middleware
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Check if the time slot is already booked
    const existingAppointment = await Appointment.findOne({
      psychologistId,
      date,
      timeSlot,
      status: { $in: ['Booked', 'Completed'] }
    });

    if (existingAppointment) {
      return res.status(409).json({ message: "This time slot is already booked" });
    }

    // Check if user already has an appointment at this time
    const userExistingAppointment = await Appointment.findOne({
      userId,
      date,
      timeSlot,
      status: { $in: ['Booked', 'Completed'] }
    });

    if (userExistingAppointment) {
      return res.status(409).json({ message: "You already have an appointment at this time" });
    }

    const appointment = new Appointment({
      userId,
      psychologistId,
      date,
      timeSlot,
      reason,
      status: "Booked",
    });
    await appointment.save();

    // Send confirmation email
    try {
      // Get user and psychologist details for email
      const user = await User.findById(userId);
      const psychologist = await Psychologist.findById(psychologistId);
      
      if (user && psychologist) {
        const emailData = {
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          psychologistName: psychologist.name,
          psychologistSpecialization: psychologist.specialization,
          reason: appointment.reason
        };
        
        await emailService.sendAppointmentConfirmation(user.email, emailData);
        console.log('Confirmation email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Don't fail the appointment booking if email fails
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Booking error:", error);
    res.status(500).json({ message: "Failed to book appointment", error: error.message });
  }
});

router.get('/available-slots', authenticateToken, async (req, res) => {
  try {
    const { psychologistId, date } = req.query;
    
    if (!psychologistId || !date) {
      return res.status(400).json({ message: "Missing psychologistId or date parameter" });
    }

    // Get all booked appointments for this psychologist on this date
    const bookedAppointments = await Appointment.find({
      psychologistId,
      date,
      status: { $in: ['Booked', 'Completed'] }
    }).select('timeSlot');

    const bookedTimeSlots = bookedAppointments.map(apt => apt.timeSlot);

    // Define available time slots (9 AM to 5 PM, hourly)
    const allTimeSlots = [
      "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"
    ];

    const availableSlots = allTimeSlots.filter(slot => !bookedTimeSlots.includes(slot));

    res.json({
      date,
      psychologistId,
      availableSlots,
      bookedSlots: bookedTimeSlots
    });
  } catch (error) {
    console.error("Error fetching available slots:", error);
    res.status(500).json({ message: "Failed to fetch available slots" });
  }
});

// Get user's appointments
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const appointments = await Appointment.find({ userId })
      .populate('psychologistId', 'name specialization')
      .sort({ date: 1, timeSlot: 1 });

    res.json(appointments);
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({ message: "Failed to fetch appointments" });
  }
});

// Cancel appointment
router.put('/cancel/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    // Use findOneAndUpdate to avoid validation issues
    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, userId, status: { $ne: 'Cancelled' } },
      { status: 'Cancelled' },
      { new: true, runValidators: false }
    ).populate('psychologistId', 'name specialization');
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or already cancelled" });
    }

    // Send cancellation email
    try {
      const user = await User.findById(userId);
      if (user && appointment.psychologistId) {
        const emailData = {
          date: appointment.date,
          timeSlot: appointment.timeSlot,
          psychologistName: appointment.psychologistId.name,
          psychologistSpecialization: appointment.psychologistId.specialization,
          reason: appointment.reason
        };
        await emailService.sendAppointmentCancellation(user.email, emailData);
        console.log('Cancellation email sent successfully');
      }
    } catch (emailError) {
      console.error('Failed to send cancellation email:', emailError);
      // Don't fail the cancellation if email fails
    }

    res.json({ message: "Appointment cancelled successfully", appointment });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({ message: "Failed to cancel appointment" });
  }
});

// Complete appointment (for psychologists)
router.put('/complete/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const psychologistId = req.user.userId;

    // Check if user is a psychologist
    if (req.user.role !== 'Psychologist') {
      return res.status(403).json({ message: "Only psychologists can complete appointments" });
    }

    // Find and update the appointment
    const appointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, psychologistId, status: 'Booked' },
      { status: 'Completed' },
      { new: true, runValidators: false }
    );
    
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found or already completed" });
    }

    res.json({ message: "Appointment marked as completed", appointment });
  } catch (error) {
    console.error("Error completing appointment:", error);
    res.status(500).json({ message: "Failed to complete appointment" });
  }
});

// Get appointment by ID
router.get('/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.userId;

    const appointment = await Appointment.findOne({ _id: appointmentId, userId })
      .populate('psychologistId', 'name specialization');

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    res.json(appointment);
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({ message: "Failed to fetch appointment" });
  }
});

module.exports = router;
