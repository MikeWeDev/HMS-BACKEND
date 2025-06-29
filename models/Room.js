const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },  // Room number as string, unique
  type: { type: String, required: true },                      // Room type (e.g., Single, Double)
  price: { type: Number, required: true },                     // Price per night
  capacity: { type: Number, required: true },                  // Number of guests allowed
  amenities: [String],                                         // Array of amenity strings (optional)
  isAvailable: { type: Boolean, default: true },               // Availability flag
}, { timestamps: true });

module.exports = mongoose.model("Room", roomSchema);
