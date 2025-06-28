const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },

  type: {
    type: String,
    enum: ["single", "double", "suite"],
    required: true,
  },

  price: {
    type: Number,
    required: true,
  },

  capacity: {
    type: Number,
    required: true,
  },

  amenities: {
    type: [String], // e.g. ["WiFi", "TV", "Air Conditioning"]
    default: [],
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Room", roomSchema);
