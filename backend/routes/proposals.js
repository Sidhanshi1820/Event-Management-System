const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Proposal = require('../models/Proposal');
const { verifyToken, verifyTokenOptional, requireAdmin } = require('../middleware/auth');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/;

// Optional auth for the whole router: links a logged-in submitter to their
// proposal when a valid Bearer token is present, otherwise continues without
// req.userId (never rejects).
router.use(verifyTokenOptional);

// Public booking proposal endpoint (auth optional).
// Rate limiting for this route is mounted in server.js (5 requests / 1 hour).
router.post('/', async (req, res) => {
  try {
    const { full_name, email, company, phone, event_type, event_date, guests, message } = req.body;

    // Required fields
    if (!full_name || !email || !company || !event_type) {
      return res.status(400).json({
        success: false,
        message: 'Full name, email, company and event type are required'
      });
    }

    // Email format
    if (!EMAIL_REGEX.test(String(email).trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email'
      });
    }

    // Guests: optional, must be a positive integer when provided.
    // Only a real number or an all-digit string is accepted — booleans, arrays,
    // objects and floats-as-strings would otherwise slip through Number().
    const guestsProvided = guests !== undefined && guests !== null && guests !== '';
    const guestsValidType =
      typeof guests === 'number' ||
      (typeof guests === 'string' && /^\d+$/.test(guests.trim()));
    if (guestsProvided && !guestsValidType) {
      return res.status(400).json({
        success: false,
        message: 'Guests must be a positive number'
      });
    }
    const guestCount = guestsProvided ? Number(guests) : NaN;
    if (guestsProvided && (!Number.isInteger(guestCount) || guestCount <= 0)) {
      return res.status(400).json({
        success: false,
        message: 'Guests must be a positive number'
      });
    }

    // Phone: optional, but must be a string when provided (a non-string would
    // throw a Mongoose CastError while saving).
    if (phone !== undefined && phone !== null && phone !== '' && typeof phone !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid phone number'
      });
    }

    // Event date: optional, must be parseable when provided
    if (event_date && isNaN(Date.parse(event_date))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid event date'
      });
    }

    const proposal = new Proposal({
      full_name,
      email,
      company,
      event_type,
      ...(phone ? { phone } : {}),
      ...(event_date ? { event_date: new Date(event_date) } : {}),
      ...(Number.isFinite(guestCount) ? { guests: guestCount } : {}),
      ...(message ? { message } : {}),
      // Link the proposal to the submitter when a valid token was provided
      ...(req.userId ? { userId: req.userId } : {})
    });

    await proposal.save();

    res.status(201).json({
      success: true,
      message: 'Proposal received. Our team will contact you within 24 hours.'
    });
  } catch (error) {
    console.error('Proposal submission error:', error);

    if (error instanceof mongoose.Error.ValidationError ||
        error instanceof mongoose.Error.CastError) {
      return res.status(400).json({
        success: false,
        message: 'Please check the details you entered.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to submit proposal'
    });
  }
});

// Admin: list all proposals, newest first (max 100).
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const proposals = await Proposal.find({})
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      proposals
    });
  } catch (error) {
    console.error('List proposals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load proposals'
    });
  }
});

// Admin: update a proposal's status.
const ALLOWED_STATUSES = ['new', 'contacted', 'closed'];

router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: new, contacted, closed'
      });
    }

    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated',
      proposal
    });
  } catch (error) {
    console.error('Update proposal status error:', error);

    if (error instanceof mongoose.Error.CastError) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update proposal status'
    });
  }
});

module.exports = router;