const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT Token
// Token comes only from the `Authorization: Bearer <token>` header.
// On success sets `req.userId`; the session is never read or written.
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      console.error('verifyToken: jwt verification failed:', error.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    const user = await User.findById(decoded.userId).select('_id tokenVersion');

    // Missing user or a stale token version means the token was revoked
    if (!user || decoded.tv !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    // Never leak internal error details to the client
    console.error('verifyToken: unexpected error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Verify JWT Token (optional)
// Same verification flow as verifyToken, but never rejects: if the header or
// token is missing or invalid, the request continues without `req.userId`.
// Used by routes where authentication is optional (e.g. POST /api/proposals).
const verifyTokenOptional = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.slice('Bearer '.length).trim();

    if (!token) {
      return next();
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return next();
    }

    const user = await User.findById(decoded.userId).select('_id tokenVersion');

    // Missing user or a stale token version means the token was revoked
    if (!user || decoded.tv !== user.tokenVersion) {
      return next();
    }

    req.userId = decoded.userId;
    next();
  } catch (error) {
    // Never leak internal error details to the client
    console.error('verifyTokenOptional: unexpected error:', error.message);
    return next();
  }
};

// Require admin role
// Must run AFTER verifyToken (it relies on `req.userId` being set).
const requireAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('role');

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access required'
      });
    }

    next();
  } catch (error) {
    // Never leak internal error details to the client
    console.error('requireAdmin: unexpected error:', error.message);
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
};

module.exports = { verifyToken, verifyTokenOptional, requireAdmin };
