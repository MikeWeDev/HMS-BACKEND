// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true }, // 👈 ADDED for profile
    phone: { type: String, required: false },               // 👈 ADDED for profile
    password: { type: String, required: true },
    loyaltyPoints: { type: Number, default: 0 },           // 👈 ADDED for profile
    role: {
      type: String,
      default: "guest",
      enum: ["guest", "employee", "receptionist", "manager", "admin"],
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare entered password with hashed one
userSchema.methods.matchPassword = function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Avoid recompiling model in dev
module.exports = mongoose.models.User || mongoose.model("User", userSchema); // Changed "users" to "User" for consistency