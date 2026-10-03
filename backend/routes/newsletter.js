const express = require('express');
const router = express.Router();
const Newsletter = require('../models/Newsletter');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// Public: subscribe an email to the newsletter.
// No rate limiter here - the global /api limiter in server.js covers it.
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    await Newsletter.create({ email: email.trim() });

    res.status(201).json({
      success: true,
      message: 'Subscribed! Watch your inbox for corporate event tips and offers.'
    });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);

    // Duplicate email (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'This email is already subscribed'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to subscribe'
    });
  }
});

module.exports = router;
