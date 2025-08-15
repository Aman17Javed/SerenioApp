const MoodLog = require('../models/moodlog');

exports.logMood = async (req, res) => {
  try {
    console.log('Request body:', req.body); // Debug: Log request body
    console.log('req.user:', req.user); // Debug: Log user object
    const { sentiment } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      console.error('No userId found in req.user');
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }

    if (!['positive', 'neutral', 'negative'].includes(sentiment)) {
      console.error('Invalid sentiment:', sentiment);
      return res.status(400).json({ message: 'Invalid sentiment value' });
    }

    const moodLog = new MoodLog({
      userId,
      sentiment,
      createdAt: new Date(),
    });

    await moodLog.save();
    console.log(`Mood logged for userId: ${userId} - ${sentiment} at ${new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`);

    res.status(201).json({ message: 'Mood logged successfully' });
  } catch (error) {
    console.error('Error logging mood:', error.message, error.stack);
    res.status(500).json({ message: 'Error logging mood', error: error.message });
  }
};