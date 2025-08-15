const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('../models/user');
const Psychologist = require('../models/psychologist');
const Appointment = require('../models/appointment');
const MoodLog = require('../models/moodlog');
const Payment = require('../models/payment');
const ChatLog = require('../models/chatlog');
const Feedback = require('../models/feedback');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/serenio', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const verifyData = async () => {
  try {
    console.log('🔍 Verifying database data...\n');

    // Get main user
    const mainUser = await User.findOne({ email: 'aman@example.com' });
    if (!mainUser) {
      console.log('❌ Main user not found');
      return;
    }

    console.log('👤 Main User:');
    console.log(`   Name: ${mainUser.name}`);
    console.log(`   Email: ${mainUser.email}`);
    console.log(`   Role: ${mainUser.role}\n`);

    // Get psychologists
    const psychologists = await Psychologist.find().populate('userId', 'name email');
    console.log('🧠 Psychologists:');
    psychologists.forEach((psych, index) => {
      console.log(`   ${index + 1}. ${psych.name}`);
      console.log(`      Specialization: ${psych.specialization}`);
      console.log(`      Rating: ${psych.rating}★ (${psych.reviews} reviews)`);
      console.log(`      Rate: PKR ${psych.hourlyRate}/hour`);
      console.log(`      Availability: ${psych.availability}\n`);
    });

    // Get appointments
    const appointments = await Appointment.find({ userId: mainUser._id })
      .populate('psychologistId', 'name specialization')
      .populate('paymentId', 'amount paymentStatus');
    
    console.log('📅 Appointments:');
    appointments.forEach((appt, index) => {
      console.log(`   ${index + 1}. ${appt.date} at ${appt.timeSlot}`);
      console.log(`      Psychologist: ${appt.psychologistId.name}`);
      console.log(`      Reason: ${appt.reason}`);
      console.log(`      Status: ${appt.status}`);
      if (appt.paymentId) {
        console.log(`      Payment: PKR ${appt.paymentId.amount} (${appt.paymentId.paymentStatus})`);
      }
      console.log('');
    });

    // Get mood logs
    const moodLogs = await MoodLog.find({ userId: mainUser._id })
      .sort({ createdAt: -1 })
      .limit(5);
    
    console.log('😊 Recent Mood Logs:');
    moodLogs.forEach((mood, index) => {
      const date = mood.createdAt.toLocaleDateString();
      const emoji = mood.sentiment === 'positive' ? '😊' : mood.sentiment === 'neutral' ? '😐' : '😔';
      console.log(`   ${index + 1}. ${date} - ${emoji} ${mood.sentiment}`);
    });
    console.log('');

    // Get chat logs
    const chatLogs = await ChatLog.find({ userId: mainUser._id })
      .sort({ createdAt: -1 })
      .limit(3);
    
    console.log('💬 Recent Chat Sessions:');
    chatLogs.forEach((chat, index) => {
      const date = chat.createdAt.toLocaleDateString();
      console.log(`   ${index + 1}. ${date} - Session: ${chat.sessionId}`);
      console.log(`      Q: ${chat.message.substring(0, 50)}...`);
      console.log(`      A: ${chat.response.substring(0, 50)}...`);
      console.log('');
    });

    // Get feedback
    const feedbacks = await Feedback.find({ userId: mainUser._id })
      .populate('messageId', 'message');
    
    console.log('⭐ Feedback:');
    feedbacks.forEach((feedback, index) => {
      console.log(`   ${index + 1}. Session: ${feedback.sessionId}`);
      console.log(`      Rating: ${feedback.rating}/5`);
      console.log(`      Comment: ${feedback.comment}`);
      console.log('');
    });

    // Summary statistics
    console.log('📊 Database Summary:');
    console.log(`   Total Users: ${await User.countDocuments()}`);
    console.log(`   Total Psychologists: ${await Psychologist.countDocuments()}`);
    console.log(`   Total Appointments: ${await Appointment.countDocuments()}`);
    console.log(`   Total Payments: ${await Payment.countDocuments()}`);
    console.log(`   Total Mood Logs: ${await MoodLog.countDocuments()}`);
    console.log(`   Total Chat Logs: ${await ChatLog.countDocuments()}`);
    console.log(`   Total Feedback: ${await Feedback.countDocuments()}`);

    console.log('\n✅ Data verification completed!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Email: aman@example.com');
    console.log('   Password: password123');

  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the verification
verifyData(); 