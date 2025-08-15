require('dotenv').config();
console.log("JWT_SECRET is:", process.env.JWT_SECRET);
const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/user');
const Psychologist = require('../models/psychologist');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middleware/authMiddleware');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const accessToken = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    user.refreshToken = refreshToken;
    await user.save();
    res.json({ message: 'Login successful', accessToken, refreshToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, role, specialization, experience, availability, hourlyRate, bio } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create user with the provided role (defaults to 'User' if not specified)
    const user = new User({ 
      name, 
      email, 
      password, 
      role: role || 'User' 
    });
    await user.save();

    // If registering as a psychologist, create a corresponding Psychologist record
    if (role === 'Psychologist') {
      const psychologist = new Psychologist({
        userId: user._id,
        name: name,
        specialization: specialization || 'General Psychology',
        experience: experience || 'Not specified',
        availability: availability || 'Available on weekdays',
        hourlyRate: hourlyRate || 2000,
        sessionPrice: hourlyRate || 2000,
        bio: bio || 'Professional psychologist ready to help you.'
      });
      await psychologist.save();
      console.log('✅ Psychologist profile created for user:', user._id);
    }

    // Generate tokens just like login
    const accessToken = jwt.sign(
      { userId: user._id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '9999y' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    user.refreshToken = refreshToken;
    await user.save();

    // Return the tokens along with the success message
    res.status(201).json({
      message: `User ${name} registered successfully.`,
      accessToken,
      refreshToken
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'Profile updated', user });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.delete('/delete', authenticateToken, async (req, res) => {
  try {
    await User.deleteOne({ _id: req.user.userId });
    await ChatLog.deleteMany({ userId: req.user.userId });
    await Transaction.deleteMany({ userId: req.user.userId });
    await Recommendation.deleteMany({ userId: req.user.userId });
    await Feedback.deleteMany({ userId: req.user.userId });
    console.log(`User data deleted for userId: ${req.user.userId}`);
    res.json({ message: 'User data deleted' });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: 'Failed to delete user data: ' + error.message });
  }
})

module.exports = router;