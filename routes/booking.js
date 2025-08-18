const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    console.log("🔵 Booking request body:", req.body);
    console.log("🔵 User info:", req.user ? req.user.id : "No user info");

    const { room: roomId, checkIn, checkOut, name } = req.body;

    if (!roomId || !checkIn || !checkOut || !name) {
      console.warn("⚠️ Missing required fields:", { roomId, checkIn, checkOut });
      return res.status(400).json({ message: "Missing required fields: room, checkIn, or checkOut" });
    }

    // Validate Mongo ObjectId format
    if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn("⚠️ Invalid roomId format:", roomId);
      return res.status(400).json({ message: "Invalid room ID format" });
    }

    // Check if room exists before booking
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      console.warn("⚠️ Room does not exist:", roomId);
      return res.status(404).json({ message: "Room not found" });
    }
    console.log(`🔎 Found room before update: #${existingRoom.roomNumber} status=${existingRoom.status}`);

    // Save booking
    const newBooking = new Booking({ ...req.body, user: req.user ? req.user.id : null });
    const savedBooking = await newBooking.save();
    console.log("✅ Booking saved with id:", savedBooking._id);

    // Update room's status in DB to "Booked" and isAvailable to false
    const updatedRoom = await Room.findByIdAndUpdate(
      roomId,
      { $set: { status: "Booked", isAvailable: false } },
      { new: true }
    );

    if (!updatedRoom) {
      console.warn("⚠️ Room not found for update (after booking):", roomId);
      return res.status(404).json({ message: "Room not found" });
    }

    console.log(`✅ Room #${updatedRoom.roomNumber} status updated to:`, updatedRoom.status, "isAvailable:", updatedRoom.isAvailable);

    res.status(201).json(savedBooking);
  } catch (err) {
    console.error("❌ Booking error:", err);
    res.status(500).json({ message: 'Booking failed', error: err.message || err.toString() });
  }
});

// GET /api/bookings/my/:uuid
router.get('/my/:uuid', async (req, res) => {
  const guestId = req.params.uuid;

  if (!guestId) {
    return res.status(400).json({ message: 'Guest ID (UUID) is required' });
  }

  try {
    const bookings = await Booking.find({ guestId }).populate("room");

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this guest ID' });
    }

    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching guest bookings:", err);
    res.status(500).json({ message: 'Failed to fetch bookings', error: err.message });
  }
});

// DELETE /api/bookings/:id
router.delete('/:id', async (req, res) => {
  const bookingId = req.params.id;

  if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({ message: "Invalid booking ID format" });
  }

  try {
    const deletedBooking = await Booking.findByIdAndDelete(bookingId);

    if (!deletedBooking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // 🟢 Reset room status when booking is deleted
    const updatedRoom = await Room.findByIdAndUpdate(
      deletedBooking.room,
      { $set: { status: "Available", isAvailable: true } },
      { new: true }
    );

    console.log(`Room ${updatedRoom?.roomNumber || "?"} status reset to:`, updatedRoom?.status);

    res.status(200).json({ message: "Booking deleted successfully" });
  } catch (err) {
    console.error("Error deleting booking:", err);
    res.status(500).json({ message: "Failed to delete booking", error: err.message });
  }
});

module.exports = router;
