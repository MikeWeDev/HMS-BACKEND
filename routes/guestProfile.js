const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Booking = require('../models/Booking');
// NOTE: The 'protect' middleware is no longer used for this specific route.
// const { protect } = require('../middleware/auth'); 

// ----------------------------------------------------------------------
// NEW IMPLEMENTATION: This route now accepts a userId in the request body.
// It bypasses JWT verification, relying on the client to provide the ID.
// ----------------------------------------------------------------------

// @route   POST /api/guest/profile
// @desc    Get a user's profile and bookings by sending the raw userId in the body.
// @access  PUBLIC (Unprotected - uses body data for lookup)
// ** Changed to POST and removed 'protect' middleware **
router.post('/profile', async (req, res) => {
    try {
        // 🔑 NEW LOGIC: Get the user ID directly from the request body
        const { userId } = req.body; 
        
        if (!userId) {
             return res.status(400).json({ message: 'User ID is required in the request body.' });
        }
        
        // 1. Fetch User Profile
        let user = await User.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found for the provided ID.' });
        }

        // 2. Fetch User's Bookings
        const bookings = await Booking.find({ user: user._id })
            .populate('room', 'roomNumber type')
            .sort({ checkIn: -1 });

        // 3. Combine and respond
        res.json({
            user: {
                _id: user._id,
                name: user.username, // Use username here as per your data structure
                email: user.email,
                phone: user.phone || 'N/A',
                loyaltyPoints: user.loyaltyPoints || 0,
            },
            recentBookings: bookings.map(b => ({
                id: b._id,
                roomNumber: b.room ? b.room.roomNumber : 'Deleted Room',
                roomType: b.room ? b.room.type : 'N/A',
                checkIn: new Date(b.checkIn).toISOString().split('T')[0],
                checkOut: new Date(b.checkOut).toISOString().split('T')[0],
                status: b.status,
                totalPrice: b.totalPrice,
            })),
        });

    } catch (error) {
        // Handle potential issues like invalid ID format (e.g., CastError from Mongoose)
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        console.error('Server Error fetching guest profile:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});


router.post('/payments', async (req, res) => {
    try {
        const { userId } = req.body; 
        
        if (!userId) {
             return res.status(400).json({ message: 'User ID is required in the request body.' });
        }
        
        // 1. Fetch all Bookings for that User (simulating Payment History)
        const bookings = await Booking.find({ user: userId })
            .populate('room', 'roomNumber type')
            .sort({ checkIn: -1 }); // Sort by check-in date

        // 2. Map Bookings to Transaction Records
        res.json(bookings.map(b => ({
            id: b._id,
            // Use totalPrice as the payment amount
            amount: b.totalPrice, 
            // Use checkIn date as the transaction date for simplicity
            date: new Date(b.checkIn).toISOString().split('T')[0], 
            // Default to a generic method/description
            method: 'Online Booking Charge', 
            // Map Booking status to a simple payment status
            status: (b.status === 'Checked-Out' || b.status === 'Booked') ? 'Completed' : 'Pending',
            description: b.room 
                         ? `Full charge for Room ${b.room.roomNumber} (${b.room.type}) - Check-in: ${new Date(b.checkIn).toLocaleDateString()}` 
                         : 'Booking charge (Room details unavailable)',
        })));

    } catch (error) {
        if (error.kind === 'ObjectId') {
             return res.status(400).json({ message: 'Invalid User ID format.' });
        }
        console.error('Server Error fetching simplified payment history (Bookings):', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});



module.exports = router;
