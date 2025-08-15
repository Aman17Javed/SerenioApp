const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  amount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['JazzCash', 'EasyPaisa', 'Manual'], default: 'JazzCash' },
  paymentStatus: { type: String, enum: ['Success', 'Failed', 'Pending'], default: 'Pending' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
