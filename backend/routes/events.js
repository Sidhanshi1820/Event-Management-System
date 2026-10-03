const express = require('express');
const router = express.Router();
const EventType = require('../models/EventType');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Auto-generate a URL slug from a title: lowercase, spaces become dashes.
const generateSlug = (title) => String(title).trim().toLowerCase().replace(/\s+/g, '-');

// Escape regex special characters so ?category= matches literally.
const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Public: list active event types, ordered by sortOrder then title.
// Optional ?category= filter (case-insensitive exact match).
router.get('/', async (req, res) => {
  try {
    const query = { active: true };

    const { category } = req.query;
    if (category && String(category).trim() !== '') {
      query.category = new RegExp(`^${escapeRegex(String(category).trim())}$`, 'i');
    }

    const events = await EventType.find(query).sort({ sortOrder: 1, title: 1 });

    res.status(200).json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events'
    });
  }
});

// Admin: create an event type.
router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, slug, category, description, icon, rating, reviews, startingPrice, sortOrder } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title, category and description are required'
      });
    }

    const eventType = new EventType({
      title,
      category,
      description,
      slug: slug || generateSlug(title),
      ...(icon !== undefined ? { icon } : {}),
      ...(rating !== undefined ? { rating } : {}),
      ...(reviews !== undefined ? { reviews } : {}),
      ...(startingPrice !== undefined ? { startingPrice } : {}),
      ...(sortOrder !== undefined ? { sortOrder } : {})
    });

    await eventType.save();

    res.status(201).json({
      success: true,
      message: 'Event type created',
      event: eventType
    });
  } catch (error) {
    console.error('Error creating event type:', error);

    // Duplicate slug/title (unique index violation)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An event type with that name already exists'
      });
    }

    // Schema validation (e.g. title over 80 characters)
    if (error && error.name === 'ValidationError' && error.errors) {
      const firstField = Object.keys(error.errors)[0];
      return res.status(400).json({
        success: false,
        message: firstField ? error.errors[firstField].message : 'Please check the details you entered.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create event type'
    });
  }
});

// Admin: update an event type (partial updates allowed).
router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { title, slug, category, description, icon, rating, reviews, startingPrice, sortOrder, active } = req.body;

    const updates = {};
    if (title !== undefined) {
      updates.title = title;
      // Keep the slug in sync unless an explicit slug was provided
      if (slug === undefined) updates.slug = generateSlug(title);
    }
    if (slug !== undefined) updates.slug = slug;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (rating !== undefined) updates.rating = rating;
    if (reviews !== undefined) updates.reviews = reviews;
    if (startingPrice !== undefined) updates.startingPrice = startingPrice;
    if (sortOrder !== undefined) updates.sortOrder = sortOrder;
    if (active !== undefined) updates.active = active;

    const event = await EventType.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event type updated',
      event
    });
  } catch (error) {
    console.error('Error updating event type:', error);

    // Schema validation
    if (error && error.name === 'ValidationError' && error.errors) {
      const firstField = Object.keys(error.errors)[0];
      return res.status(400).json({
        success: false,
        message: firstField ? error.errors[firstField].message : 'Please check the details you entered.'
      });
    }

    // Malformed id
    if (error && error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    // Duplicate slug (e.g. renamed a title onto an existing one)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'An event type with that name already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update event type'
    });
  }
});

// Admin: delete an event type.
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const event = await EventType.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Event type deleted'
    });
  } catch (error) {
    console.error('Error deleting event type:', error);

    // Malformed id
    if (error && error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Event type not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete event type'
    });
  }
});

module.exports = router;
