const express = require('express');
const router = express.Router();
const jwtAuth = require('../middleware/authMiddleware');
const User = require('../models/user');

router.get('/', jwtAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-refreshToken -password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/', jwtAuth, async (req, res) => {
  const { name, email } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { name, email },
      { new: true, runValidators: true }
    ).select('-password');
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Profile PUT error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;