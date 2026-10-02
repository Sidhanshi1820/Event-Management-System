const jwt = require('jsonwebtoken');

// Verify JWT Token
const verifyToken = (req, res, next) => {
  // Check token from headers or session
  const token = req.headers.authorization?.split(' ')[1] || req.session.token;

  if (!token && !req.session.userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      req.userId = decoded.userId;
      req.session.userId = decoded.userId;
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }

  next();
};

module.exports = { verifyToken };
