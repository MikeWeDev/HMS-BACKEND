// routes/checkout.js
const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');

// GET all rooms with a 'Checked-In' status. Path is now just '/' since it's mounted at /api/checkout
router.get('/', async (req, res) => {
  try {
    const checkedInRooms = await Room.find({ status: 'Checked-In' });
    res.json(checkedInRooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST to change a room and booking status to 'Available'
// Path is now just '/:roomId' since it's mounted at /api/checkout
router.post('/:roomId', async (req, res) => {
  try {
    const room = await Room.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    room.status = 'Available';
    room.isAvailable = true;
    await room.save();

    const booking = await Booking.findOne({ room: req.params.roomId, status: 'Checked-In' });
    if (booking) {
      booking.status = 'Checked-Out';
      await booking.save();
    }

    res.status(200).json({ message: 'Checkout successful', room });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;