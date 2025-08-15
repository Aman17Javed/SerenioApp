
const mongoose = require('mongoose');

const moodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sentiment: { type: String, required: true, enum: ['positive', 'neutral', 'negative'] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MoodLog', moodLogSchema);
