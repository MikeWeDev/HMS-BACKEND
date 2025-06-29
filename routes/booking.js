// backend/routes/bookings.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Booking = require('../models/Booking');

// POST /api/bookings
router.post('/', protect, async (req, res) => {
  try {
    const newBooking = new Booking({ ...req.body, user: req.user.id });
    const saved = await newBooking.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ message: 'Booking failed' });
  }
});

// GET /api/bookings/my
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user.id }).populate('room');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

module.exports = router;
