const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { sendMail, isSmtpConfigured } = require('../utils/mailer');

// Frontend base URL used for email links and verification redirects.
const getAppUrl = () => process.env.APP_URL || 'http://localhost:8080';

// Generate JWT Token
// `tv` is the user's current tokenVersion — bumping it on the user document
// invalidates every token issued before that change.
const generateToken = (userId, userTokenVersion) => {
  return jwt.sign({ userId, tv: userTokenVersion }, process.env.JWT_SECRET, {
    expiresIn: '24h'
  });
};

// ---------------------------------------------------------------------------
// Login lockout (in-memory; resets when the server restarts)
// Keyed by lowercased email: 5 failed logins lock that email for 15 minutes.
// ---------------------------------------------------------------------------
const loginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
const LOCKED_MESSAGE = 'Too many failed attempts. Try again in 15 minutes.';

const isLockedOut = (email) => {
  const key = String(email).toLowerCase();
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  if (entry.lockedUntil > Date.now()) return true;
  loginAttempts.delete(key); // lock expired — start fresh
  return false;
};

// Records a failed login. Returns true when this failure triggered the lock.
const recordFailedLogin = (email) => {
  const key = String(email).toLowerCase();
  const entry = loginAttempts.get(key) || { count: 0, lockedUntil: 0 };
  entry.count += 1;

  let justLocked = false;
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
    entry.count = 0;
    justLocked = true;
  }

  loginAttempts.set(key, entry);
  return justLocked;
};

const clearFailedLogins = (email) => {
  loginAttempts.delete(String(email).toLowerCase());
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
      isVerified: true // still auto-verified at signup; the emailed link re-confirms
    });

    await user.save();

    // Verification link — a self-contained 24h JWT carrying purpose:'verify'.
    // Nothing is stored server-side: a valid signature is the proof.
    const verifyToken = jwt.sign(
      { userId: user._id, purpose: 'verify' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const verifyUrl = `${getAppUrl()}/api/auth/verify/${verifyToken}`;
    // Fire-and-forget: registration must succeed even if mail delivery fails
    // (sendMail never throws, the wrapper just guards the async path).
    Promise.resolve(sendMail({
      to: user.email,
      subject: 'Verify your EventNov@ account',
      html: `
        <p>Hi ${user.fullName},</p>
        <p>Welcome to EventNov@! Please confirm your email address by clicking the link below:</p>
        <p><a href="${verifyUrl}">Verify my email</a></p>
        <p>This link expires in 24 hours. If you did not create an account, you can safely ignore this email.</p>
      `
    })).catch((mailError) => console.error('Verification email error:', mailError));

    // Generate token
    const token = generateToken(user._id, user.tokenVersion);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        role: user.role
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
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Account lockout — checked before touching the database
    if (isLockedOut(email)) {
      return res.status(423).json({
        success: false,
        message: LOCKED_MESSAGE
      });
    }

    // Find user and select password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      const justLocked = recordFailedLogin(email);
      return res.status(justLocked ? 423 : 401).json({
        success: false,
        message: justLocked ? LOCKED_MESSAGE : 'Invalid email or password'
      });
    }

    // Compare password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      const justLocked = recordFailedLogin(email);
      return res.status(justLocked ? 423 : 401).json({
        success: false,
        message: justLocked ? LOCKED_MESSAGE : 'Invalid email or password'
      });
    }

    // Successful login clears the failed-attempt counter for this email
    clearFailedLogins(email);

    // Add login history
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent') || 'Unknown';
    user.addLoginHistory(ipAddress, userAgent);
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id, user.tokenVersion);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        role: user.role,
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
// JWT + tokenVersion is the only auth — there is no server-side session.
router.post('/logout', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (user) {
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logout successful'
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
        company: user.company,
        role: user.role
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

// Email verification link (from the registration email) — no auth required.
router.get('/verify/:token', async (req, res) => {
  const appUrl = getAppUrl();
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);

    if (!decoded || decoded.purpose !== 'verify' || !decoded.userId) {
      return res.redirect(`${appUrl}/get-started.html?verified=0`);
    }

    await User.findByIdAndUpdate(decoded.userId, { isVerified: true });
    return res.redirect(`${appUrl}/get-started.html?verified=1`);
  } catch (error) {
    console.error('Email verification error:', error.message);
    return res.redirect(`${appUrl}/get-started.html?verified=0`);
  }
});

// Forgot password — always answers with the same generic 200 so the endpoint
// cannot be used to enumerate registered emails.
router.post('/forgot-password', async (req, res) => {
  const genericResponse = {
    success: true,
    message: 'If that email is registered, a reset link has been sent.'
  };

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(200).json(genericResponse);
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });

    if (user) {
      // The raw token only ever goes out in the email; the database stores
      // its SHA-256 hash, so a DB leak cannot be replayed as a reset link.
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      const resetUrl = `${getAppUrl()}/reset.html?token=${resetToken}`;
      // Fire-and-forget (sendMail never throws); response stays generic.
      Promise.resolve(sendMail({
        to: user.email,
        subject: 'Reset your EventNov@ password',
        html: `
          <p>Hi ${user.fullName},</p>
          <p>We received a request to reset your EventNov@ password. Click the link below to choose a new one:</p>
          <p><a href="${resetUrl}">Reset my password</a></p>
          <p>This link expires in 10 minutes. If you did not request a reset, you can safely ignore this email.</p>
        `
      })).catch((mailError) => console.error('Password reset email error:', mailError));

      // Dev convenience only: without SMTP there is no inbox to read the link.
      // The raw token must NEVER be exposed in production.
      if (!isSmtpConfigured() && process.env.NODE_ENV !== 'production') {
        return res.status(200).json({ ...genericResponse, resetToken });
      }
    }

    return res.status(200).json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    // Even on an internal failure, keep the generic 200 — nothing leaks.
    return res.status(200).json(genericResponse);
  }
});

// Reset password with the token emailed by /forgot-password.
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: 'Reset token and new password are required'
      });
    }

    // bcrypt silently truncates anything past 72 BYTES (see register), and a
    // reset must set a real password, not a 7-character one.
    if (
      password.length < 8 ||
      password.length > 72 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      return res.status(400).json({
        success: false,
        message: 'Password must be 8-72 characters long'
      });
    }

    const hashedToken = crypto.createHash('sha256').update(String(token)).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link'
      });
    }

    // The pre-save hook hashes the new password.
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    // Revoke every token issued so far (signs other devices out).
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful. Please log in.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      message: 'Password reset failed. Please try again.'
    });
  }
});

module.exports = router;
