const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// GET /api/rooms - All rooms or filtered by status query param
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      if (status === "Available") {
        filter.isAvailable = true;
      } else {
        filter.status = status;
      }
    }

    const rooms = await Room.find(filter);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/rooms/:id/checkin
// PUT /api/rooms/checkin/:id
router.put("/checkin/:id", async (req, res) => {
  try {
    console.log("🔔 PUT /api/rooms/checkin/:id called");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body); // In case you expect data in body

    const roomId = req.params.id;
    console.log("Looking for room with ID:", roomId);

    const room = await Room.findById(roomId);
    if (!room) {
      console.log(`❌ Room with ID ${roomId} not found`);
      return res.status(404).json({ message: "Room not found" });
    }

    console.log("Found room:", room);

    room.isAvailable = false;
    room.status = "Checked-In"; // Optional custom status
    await room.save();

    console.log("Room status updated to checked-in and saved.");

    res.json({ message: "Room checked in successfully", room });
  } catch (err) {
    console.error("🔥 Error in check-in route:", err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/rooms/:id/status
router.put("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Update status
    room.status = status;

    // Update availability
    if (status === "Checked-In" || status === "Booked") {
      room.isAvailable = false;
    } else if (status === "Available") {
      room.isAvailable = true;
    }

    await room.save();

    res.json({ message: `Room status updated to ${status}`, room });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});




// GET /api/rooms/:id - Single room by ID
router.get("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
