const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Helper function to calculate number of nights between two dates
// This function is required for calculating totalPrice based on checkIn/checkOut
const calculateNights = (checkInDate, checkOutDate) => {
    // Convert to UTC dates for accurate day difference calculation
    const checkIn = new Date(new Date(checkInDate).toISOString().split('T')[0]);
    const checkOut = new Date(new Date(checkOutDate).toISOString().split('T')[0]);
    
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
    
    // Ensure at least one night is calculated if dates are valid
    return diffDays > 0 ? diffDays : 0; 
};

// POST /api/bookings
router.post('/', async (req, res) => {
  try {
    console.log("🔵 Booking request body:", req.body);
    
    // Check for user ID from token (for authenticated users) or from body (for custom non-token flows)
    const userIdFromToken = req.user ? req.user.id : null;
    const userIdFromBody = req.body.user; // <-- Client is now sending the MongoDB ID here

    const effectiveUserId = userIdFromToken || userIdFromBody;
    
    console.log("🔵 Effective User ID:", effectiveUserId);

    const { room: roomId, checkIn, checkOut, name } = req.body;

    if (!roomId || !checkIn || !checkOut || !name || !effectiveUserId) {
      console.warn("⚠️ Missing required fields:", { roomId, checkIn, checkOut, user: effectiveUserId });
      return res.status(400).json({ message: "Missing required fields: room, checkIn, checkOut, or user ID" });
    }

    // Validate Mongo ObjectId format for room ID
    if (!roomId.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn("⚠️ Invalid roomId format:", roomId);
      return res.status(400).json({ message: "Invalid room ID format" });
    }
    
    // Validate Mongo ObjectId format for user ID (optional but recommended for security)
    if (!effectiveUserId.match(/^[0-9a-fA-F]{24}$/)) {
      console.warn("⚠️ Invalid effectiveUserId format:", effectiveUserId);
    }


    // Check if room exists before booking
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom) {
      console.warn("⚠️ Room does not exist:", roomId);
      return res.status(404).json({ message: "Room not found" });
    }
    console.log(`🔎 Found room before update: #${existingRoom.roomNumber} status=${existingRoom.status}`);

    // 🔑 START FIX: Calculate Total Price ------------------------------------
    const nights = calculateNights(checkIn, checkOut);

    if (!existingRoom.price || typeof existingRoom.price !== 'number') {
        console.warn("⚠️ Room price is missing or invalid on room object:", roomId);
        return res.status(500).json({ message: "Cannot calculate total price: Room price is undefined or invalid." });
    }
    
    const calculatedTotalPrice = existingRoom.price * nights;
    console.log(`💲 Calculated Total Price: ${calculatedTotalPrice} (Nights: ${nights}, Price: ${existingRoom.price})`);
    // 🔑 END FIX: Calculate Total Price --------------------------------------


    // Save booking
    const newBooking = new Booking({ 
        ...req.body, 
        user: effectiveUserId, // Use the determined MongoDB ID
        totalPrice: calculatedTotalPrice, // 🔑 CRITICAL FIX: Save the calculated price
        // Removed: guestId: user._id as 'user' object is not defined here.
    });
    
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



// 🔑 NEW: GET /api/bookings/:id - Get a single booking by ID
router.get('/:id', async (req, res) => {
    const bookingId = req.params.id;

    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid booking ID format" });
    }

    try {
        // Populate the room details
        const booking = await Booking.findById(bookingId).populate("room");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        res.status(200).json(booking);
    } catch (err) {
        console.error("Error fetching single booking:", err);
        res.status(500).json({ message: "Failed to fetch booking", error: err.message });
    }
});


// 🔑 NEW: PUT /api/bookings/:id - Update a booking by ID
router.put('/:id', async (req, res) => {
    const bookingId = req.params.id;

    if (!bookingId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ message: "Invalid booking ID format" });
    }

    try {
        const { checkIn, checkOut, name, guests, room: roomId } = req.body;
        
        if (!checkIn || !checkOut || !name || !guests || !roomId) {
            return res.status(400).json({ message: "Missing required fields for update: checkIn, checkOut, name, guests, or room ID" });
        }
        
        // 1. Fetch the room to get the current price for recalculation
        const existingRoom = await Room.findById(roomId);
        if (!existingRoom) {
            return res.status(404).json({ message: "Room not found" });
        }
        
        // 2. Recalculate Total Price
        const nights = calculateNights(checkIn, checkOut);

        if (!existingRoom.price || typeof existingRoom.price !== 'number') {
            return res.status(500).json({ message: "Cannot calculate total price: Room price is undefined or invalid." });
        }
        
        const calculatedTotalPrice = existingRoom.price * nights;


        // 3. Update the booking document
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { 
                $set: { 
                    checkIn, 
                    checkOut, 
                    name, 
                    guests,
                    totalPrice: calculatedTotalPrice, // 🔑 Update the total price
                    // We assume the room ID remains the same for simplicity
                } 
            },
            { new: true, runValidators: true } // Return the updated document and run Mongoose schema validators
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found for update" });
        }

        res.status(200).json(updatedBooking);

    } catch (err) {
        console.error("❌ Booking update error:", err);
        res.status(500).json({ message: 'Booking update failed', error: err.message || err.toString() });
    }
});


router.get('/my/:userId', async (req, res) => {
  const userId = req.params.userId; // Now expecting MongoDB ID

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    // 🔍 IMPORTANT: Changed lookup field from 'guestId' to 'user'
    const bookings = await Booking.find({ user: userId }).populate("room"); 

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'No bookings found for this user ID' });
    }

    res.status(200).json(bookings);
  } catch (err) {
    console.error("Error fetching user bookings:", err);
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
