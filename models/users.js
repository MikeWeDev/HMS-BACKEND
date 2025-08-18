const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true }, // changed from "name"
    password: { type: String, required: true },
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
module.exports = mongoose.models.User || mongoose.model("users", userSchema);
