const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../models/user');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.role) decoded.role = 'User';
    req.user = decoded;

    console.log('Token decoded:', { iat: decoded.iat * 1000, exp: decoded.exp * 1000, now: Date.now() });
    const issuedAt = decoded.iat * 1000;
    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    if (issuedAt < fifteenMinutesAgo) {
      console.log('Token expired, attempting refresh');
      throw new jwt.TokenExpiredError('Token expired', new Date(decoded.exp * 1000));
    }

    next();
  } catch (error) {
    console.log('Token verification error:', error.name, error.message);
    if (error.name === 'TokenExpiredError' && req.headers['refresh-token']) {
      console.log('Refreshing token...');
      const refreshToken = req.headers['refresh-token'];
      console.log('Header refresh token:', refreshToken);
      try {
        const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_SECRET);
        console.log('Decoded refresh token userId:', decodedRefresh.userId);
        const user = await User.findOne({ _id: decodedRefresh.userId });
        console.log('DB user found:', user ? user._id : 'null', 'DB refresh token:', user ? user.refreshToken : 'null');
        if (!user || user.refreshToken !== refreshToken) {
          throw new Error('Invalid refresh token');
        }

        const newAccessToken = jwt.sign(
          { userId: user._id, name: user.name, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: '15m' }
        );
        const newRefreshToken = jwt.sign(
          { userId: user._id },
          process.env.JWT_SECRET,
          { expiresIn: '7d' }
        );

        user.refreshToken = newRefreshToken;
        await user.save();

        req.user = jwt.decode(newAccessToken);
        req.headers['authorization'] = `Bearer ${newAccessToken}`;
        console.log('New access token issued:', newAccessToken);
        next();
      } catch (refreshError) {
        console.error('Refresh token error:', refreshError.message);
        return res.status(403).json({ message: "Forbidden: Invalid refresh token" });
      }
    } else {
      console.error("❌ Token verification failed:", error);
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
  }
};

module.exports = authenticateToken;