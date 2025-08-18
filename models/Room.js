// models/room.js
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [String],
  isAvailable: { type: Boolean, default: true },
  status: {
    type: String,
    enum: ["Available", "Booked", "Checked-In"],
    default: "Available",
  },
}, { timestamps: true });

// Check if the model already exists before compiling
module.exports = mongoose.models.Room || mongoose.model("Room", roomSchema);