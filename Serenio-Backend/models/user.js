const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const iv = crypto.randomBytes(16);
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
  type: String,
  required: true,
  unique: true,
  lowercase: true,
  trim: true
},
  password: { type: String, required: true },
  role: { type: String, enum: ['User', 'Psychologist', 'Admin'], default: 'User' },
  refreshToken: { type: String }
}, { toJSON: { getters: true }, toObject: { getters: true } });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);