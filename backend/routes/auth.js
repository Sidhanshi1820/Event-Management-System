const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');

// Generate JWT Token
// `tv` is the user's current tokenVersion — bumping it on the user document
// invalidates every token issued before that change.
const generateToken = (userId, userTokenVersion) => {
  return jwt.sign({ userId, tv: userTokenVersion }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, company, password, confirm_password } = req.body;

    // Validation
    if (!full_name || !email || !company || !password || !confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if passwords match
    if (password !== confirm_password) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // bcrypt silently truncates anything past 72 BYTES, not 72 characters.
    // A 56-char emoji password is 96 UTF-8 bytes and would be truncated, so a
    // different 44-char password could match the same hash. Check bytes too.
    if (password.length > 72 || Buffer.byteLength(password, 'utf8') > 72) {
      return res.status(400).json({
        success: false,
        message: 'Password cannot exceed 72 characters'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Create new user
    const user = new User({
      fullName: full_name,
      email: email.toLowerCase(),
      company,
      password,
      isVerified: true // Auto-verify for now (you can add email verification later)
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id, user.tokenVersion);

    // Store in session
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userName = user.fullName;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Registration error:', error);

    // Duplicate key (email already in the collection)
    if (error && error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Schema validation (password length, name/company characters, email format)
    if (error && error.name === 'ValidationError' && error.errors) {
      const firstField = Object.keys(error.errors)[0];
      return res.status(400).json({
        success: false,
        message: firstField ? error.errors[firstField].message : 'Please check the details you entered.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password, remember } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Add login history
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    user.addLoginHistory(ipAddress, userAgent);
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.tokenVersion);

    // Set session
    const sessionExpiry = remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    req.session.cookie.maxAge = sessionExpiry;
    req.session.userId = user._id;
    req.session.userEmail = user.email;
    req.session.userName = user.fullName;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// Logout Route
// Bumping tokenVersion revokes every JWT already issued for this user.
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
    }

    // Destroying the session is best-effort; the token is already revoked,
    // so a missing/failed session must not fail the logout.
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed. Please try again.'
    });
  }
});

// Check authentication status
router.get('/status', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        company: user.company
      }
    });
  } catch (error) {
    console.error('Auth status error:', error);
    res.status(401).json({
      success: false,
      authenticated: false,
      message: 'Not authenticated'
    });
  }
});

// Get login history
router.get('/login-history', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      loginHistory: user.loginHistory || []
    });
  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch login history'
    });
  }
});

module.exports = router;
