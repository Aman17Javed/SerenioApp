const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Psychologist.deleteMany({});
    await Appointment.deleteMany({});
    await MoodLog.deleteMany({});
    await Payment.deleteMany({});
    await ChatLog.deleteMany({});
    await Feedback.deleteMany({});

    console.log('🗑️  Cleared existing data');

    // Create main user (aman@example.com)
    const hashedPassword = await bcrypt.hash('password123', 10);
    const mainUser = new User({
      name: 'Aman Khan',
      email: 'aman@example.com',
      password: hashedPassword,
      role: 'User'
    });
    await mainUser.save();
    console.log('✅ Created main user: aman@example.com');

    // Create psychologist users
    const psychologistUsers = [
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@example.com',
        password: hashedPassword,
        role: 'Psychologist'
      },
      {
        name: 'Dr. Michael Chen',
        email: 'michael.chen@example.com',
        password: hashedPassword,
        role: 'Psychologist'
      },
      {
        name: 'Dr. Emily Rodriguez',
        email: 'emily.rodriguez@example.com',
        password: hashedPassword,
        role: 'Psychologist'
      }
    ];

    const savedPsychologistUsers = [];
    for (const userData of psychologistUsers) {
      const user = new User(userData);
      const savedUser = await user.save();
      savedPsychologistUsers.push(savedUser);
    }
    console.log('✅ Created psychologist users');

    // Create admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'Admin'
    });
    await adminUser.save();
    console.log('✅ Created admin user');

    // Create psychologists
    const psychologists = [
      {
        userId: savedPsychologistUsers[0]._id,
        name: 'Dr. Sarah Johnson',
        specialization: 'Cognitive Behavioral Therapy',
        rating: 4.8,
        reviews: 127,
        experience: '12 years',
        availability: 'Mon-Fri 9:00-17:00',
        hourlyRate: 2500,
        sessionPrice: 2500,
        bio: 'Specialized in treating anxiety, depression, and trauma using evidence-based CBT techniques.',
        imageUrl: 'https://example.com/sarah-johnson.jpg'
      },
      {
        userId: savedPsychologistUsers[1]._id,
        name: 'Dr. Michael Chen',
        specialization: 'Anxiety and Stress Management',
        rating: 4.6,
        reviews: 89,
        experience: '8 years',
        availability: 'Tue-Thu 10:00-18:00',
        hourlyRate: 2200,
        sessionPrice: 2200,
        bio: 'Expert in anxiety disorders, stress management, and mindfulness-based interventions.',
        imageUrl: 'https://example.com/michael-chen.jpg'
      },
      {
        userId: savedPsychologistUsers[2]._id,
        name: 'Dr. Emily Rodriguez',
        specialization: 'Depression and Mood Disorders',
        rating: 4.9,
        reviews: 156,
        experience: '15 years',
        availability: 'Mon-Sat 8:00-16:00',
        hourlyRate: 2800,
        sessionPrice: 2800,
        bio: 'Specialized in treating depression, bipolar disorder, and other mood-related conditions.',
        imageUrl: 'https://example.com/emily-rodriguez.jpg'
      }
    ];

    const savedPsychologists = [];
    for (const psychData of psychologists) {
      const psychologist = new Psychologist(psychData);
      const savedPsych = await psychologist.save();
      savedPsychologists.push(savedPsych);
    }
    console.log('✅ Created psychologists');

    // Create appointments with future dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setDate(nextMonth.getDate() + 30);

    const formatDate = (date) => {
      return date.toISOString().split('T')[0]; // YYYY-MM-DD format
    };

    const appointments = [
      {
        userId: mainUser._id,
        psychologistId: savedPsychologists[0]._id,
        date: formatDate(tomorrow),
        timeSlot: '10:00',
        reason: 'Anxiety and stress management consultation',
        status: 'Booked'
      },
      {
        userId: mainUser._id,
        psychologistId: savedPsychologists[1]._id,
        date: formatDate(nextWeek),
        timeSlot: '14:00',
        reason: 'Follow-up session for anxiety treatment',
        status: 'Booked'
      },
      {
        userId: mainUser._id,
        psychologistId: savedPsychologists[2]._id,
        date: formatDate(nextMonth),
        timeSlot: '11:00',
        reason: 'Depression assessment and treatment planning',
        status: 'Booked'
      },
      {
        userId: mainUser._id,
        psychologistId: savedPsychologists[0]._id,
        date: formatDate(new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000)), // 2 weeks from now
        timeSlot: '15:00',
        reason: 'Regular therapy session',
        status: 'Booked'
      }
    ];

    const savedAppointments = [];
    for (const apptData of appointments) {
      const appointment = new Appointment(apptData);
      const savedAppt = await appointment.save();
      savedAppointments.push(savedAppt);
    }
    console.log('✅ Created appointments');

    // Create payments
    const payments = [
      {
        userId: mainUser._id,
        appointmentId: savedAppointments[0]._id,
        amount: 2500,
        paymentMethod: 'JazzCash',
        paymentStatus: 'Success'
      },
      {
        userId: mainUser._id,
        appointmentId: savedAppointments[1]._id,
        amount: 2200,
        paymentMethod: 'EasyPaisa',
        paymentStatus: 'Success'
      },
      {
        userId: mainUser._id,
        appointmentId: savedAppointments[2]._id,
        amount: 2800,
        paymentMethod: 'Manual',
        paymentStatus: 'Pending'
      }
    ];

    const savedPayments = [];
    for (const paymentData of payments) {
      const payment = new Payment(paymentData);
      const savedPayment = await payment.save();
      savedPayments.push(savedPayment);
    }
    console.log('✅ Created payments');

    // Update appointments with payment IDs
    for (let i = 0; i < savedAppointments.length - 1; i++) {
      savedAppointments[i].paymentId = savedPayments[i]._id;
      await savedAppointments[i].save();
    }

    // Create mood logs with recent dates
    const moodLogs = [];
    const sentiments = ['positive', 'neutral', 'negative', 'positive', 'neutral', 'positive', 'positive', 'neutral', 'positive', 'positive'];
    
    for (let i = 9; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(10 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60));
      
      moodLogs.push({
        userId: mainUser._id,
        sentiment: sentiments[9 - i],
        createdAt: date
      });
    }

    for (const moodData of moodLogs) {
      const moodLog = new MoodLog(moodData);
      await moodLog.save();
    }
    console.log('✅ Created mood logs');

    // Create chat logs with recent dates
    const chatLogs = [
      {
        userId: mainUser._id,
        sessionId: 'session_001',
        message: 'I\'ve been feeling anxious lately',
        response: 'I understand you\'re feeling anxious. Can you tell me more about what\'s been causing this anxiety?',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        userId: mainUser._id,
        sessionId: 'session_001',
        message: 'Work has been very stressful',
        response: 'Work stress can definitely contribute to anxiety. What specific aspects of work are most challenging for you?',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000) // 2 days ago + 5 minutes
      },
      {
        userId: mainUser._id,
        sessionId: 'session_002',
        message: 'I\'m having trouble sleeping',
        response: 'Sleep issues are common with anxiety. Have you noticed any patterns in your sleep difficulties?',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      },
      {
        userId: mainUser._id,
        sessionId: 'session_002',
        message: 'I wake up in the middle of the night',
        response: 'That\'s a common symptom. Let\'s work on some relaxation techniques that might help.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 10 * 60 * 1000) // 1 day ago + 10 minutes
      }
    ];

    const savedChatLogs = [];
    for (const chatData of chatLogs) {
      const chatLog = new ChatLog(chatData);
      const savedChat = await chatLog.save();
      savedChatLogs.push(savedChat);
    }
    console.log('✅ Created chat logs');

    // Create feedback
    const feedbacks = [
      {
        userId: mainUser._id,
        sessionId: 'session_001',
        messageId: savedChatLogs[0]._id,
        rating: 5,
        comment: 'Very helpful session, the therapist was understanding and provided practical advice.'
      },
      {
        userId: mainUser._id,
        sessionId: 'session_002',
        messageId: savedChatLogs[2]._id,
        rating: 4,
        comment: 'Good session, learned some useful techniques for managing anxiety.'
      }
    ];

    for (const feedbackData of feedbacks) {
      const feedback = new Feedback(feedbackData);
      await feedback.save();
    }
    console.log('✅ Created feedback');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample Data Summary:');
    console.log(`👤 Users: ${await User.countDocuments()}`);
    console.log(`🧠 Psychologists: ${await Psychologist.countDocuments()}`);
    console.log(`📅 Appointments: ${await Appointment.countDocuments()}`);
    console.log(`💳 Payments: ${await Payment.countDocuments()}`);
    console.log(`😊 Mood Logs: ${await MoodLog.countDocuments()}`);
    console.log(`💬 Chat Logs: ${await ChatLog.countDocuments()}`);
    console.log(`⭐ Feedback: ${await Feedback.countDocuments()}`);
    
    console.log('\n🔑 Login Credentials:');
    console.log('Email: aman@example.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the seeding
seedDatabase(); 