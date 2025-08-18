// models/booking.js
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
  guestId: { type: String, required: false },
  name: { type: String, required: true },
  room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  status: {
    type: String,
    enum: ["pending", "Available", "Booked", "Checked-In", "Checked-Out"],
    default: "pending", // I've changed the default to "pending" to better reflect the initial state of a new booking.
  },
}, { timestamps: true });

// Check if the model already exists before compiling
module.exports = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);