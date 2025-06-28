const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const { protect } = require("../middlewares/authMiddleware");


router.get("/my", protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("room")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



router.post("/", protect, async (req, res) => {
  const { room, checkIn, checkOut, totalPrice } = req.body;

  try {
    const booking = await Booking.create({
      user: req.user._id,
      room,
      checkIn,
      checkOut,
      totalPrice,
      status: "pending",
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

