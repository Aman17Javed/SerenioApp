const mongoose = require("mongoose");

const psychologistSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  specialization: { type: String, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  experience: { type: String },
  availability: { type: String },
  imageUrl: { type: String },
  hourlyRate: {
    type: Number,
    required: true,
    default: 2000 // e.g., in PKR
  },
  sessionPrice: {
    type: Number,
    required: true,
    default: 2000 // e.g., in PKR, can be set differently from hourlyRate
  },
  bio: { type: String },
  createdAt: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now } // Optional
});

module.exports = mongoose.model("Psychologist", psychologistSchema);