require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const app = express();
require('dotenv').config();
const FLASK_URL = process.env.FLASK_URL || `http://127.0.0.1:${process.env.FLASK_PORT || 5001}`;
const axios = require('axios');
const path = require("path");

const cors = require('cors');
app.use(cors({
  origin: "https://serenio-frontend-inky.vercel.app",
  credentials: true,
}));

// Middleware
app.use(helmet());
// app.use(cors());
app.use(express.json());

// Import and use routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const privateRoutes = require('./routes/private');
app.use('/api/private', privateRoutes);

const psychologistRoutes = require("./routes/psychologistRoutes");
app.use("/api", psychologistRoutes);

const profileRoutes = require('./routes/profile');
app.use('/api/profile', profileRoutes);

const moodRoutes = require('./routes/mood'); // Ensure this line exists
app.use('/api/mood', moodRoutes);

const appointmentRoutes = require('./routes/appointment');
app.use('/api/appointments', appointmentRoutes);

// const adminRoutes = require('./routes/admin');
// app.use('/api/admin', adminRoutes);

const simpleAdminRoutes = require('./routes/simpleadmin');
app.use('/api/admin', simpleAdminRoutes);

const paymentRoutes = require('./routes/payment');
app.use('/api/payment', paymentRoutes);

const chatRoutes = require('./routes/chat');
app.use('/api/chat', chatRoutes);

app.use('/api/chatlogs', require('./routes/chatlog'));
app.use('/api/openai', require('./routes/openai'));

const webhookRoutes = require('./routes/webhook');
app.use('/api/webhook', webhookRoutes);

const chatbotRoute = require('./routes/chatbot');
app.use('/api/chatbot', chatbotRoute);

// New dashboard routes (adjusted mounting with debug)
const dashboardRoutes = require('./routes/dashboard');
if (!dashboardRoutes || typeof dashboardRoutes !== 'function') {
  console.error('❌ Failed to load dashboardRoutes from ./routes/dashboard. Check file path or syntax.');
} else {
  console.log('✅ Loaded dashboardRoutes successfully');
}
app.use('/api/dashboard', dashboardRoutes);

const reportRoutes = require('./routes/report');
app.use('/api/report', reportRoutes);

const recommendationRoutes = require('./routes/recommendations');
app.use('/api/recommendations', recommendationRoutes);

const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('Serenio backend is live 🚀');
});
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

async function checkFlaskHealth() {
  try {
    const response = await axios.get(FLASK_URL + '/');
    console.log('✅ Flask server is reachable');
    return { flask_connection: true };
  } catch (error) {
    console.error('❌ Flask server is NOT reachable:', error.message);
    return { flask_connection: false };
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Base URL: http://localhost:${PORT}`);
  console.log(`🤖 Chatbot health check: http://localhost:${PORT}/api/chatbot/health`);
  checkFlaskHealth().then(result => {
    console.log('🏥 Health check result:', {
      status: result.flask_connection ? 'healthy' : 'unhealthy',
      timestamp: new Date().toLocaleString(),
      flask_connection: result.flask_connection,
      flask_url: FLASK_URL
    });
  });
});