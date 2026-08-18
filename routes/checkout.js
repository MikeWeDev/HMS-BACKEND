// routes/checkout.js

const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// GET all rooms currently marked as Checked-In.
// This router is mounted at /api/checkout.
router.get('/', async (req, res) => {
  try {
    const checkedInRooms = await Room.find({ status: 'Checked-In' });

    res.json(checkedInRooms);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST checkout for a specific room.
// The room and its active booking are updated to their checkout states.
router.post('/:roomId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.status = 'Available';
    room.isAvailable = true;
    await room.save();

    const booking = await Booking.findOne({
      room: req.params.roomId,
      status: 'Checked-In',
    });

    if (booking) {
      booking.status = 'Checked-Out';
      await booking.save();
    }

    res.status(200).json({
      message: 'Checkout successful',
      room,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;