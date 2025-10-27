const express = require('express');
const router = express.Router();
const User = require('../models/users');
const Booking = require('../models/Booking');
// ASSUME: 'protect' is your authentication middleware that extracts the user ID from the JWT
const { protect } = require('../middleware/auth'); // <--- YOU MUST HAVE THIS FILE/FUNCTION

// ----------------------------------------------------------------------
// AUTHENTICATION RE-IMPLEMENTED: This route now requires a valid JWT.
// It will fetch data based on the user ID provided by the 'protect' middleware.
// ----------------------------------------------------------------------

// @route   GET /api/guest/profile
// @desc    Get the LOGGED-IN user's profile and bookings
// @access  PRIVATE (Protected)
// ** Use `protect` here to secure the route and get the user's ID **
router.get('/profile', protect, async (req, res) => {
    try {
        // 🔑 CRITICAL FIX 3: Get the authenticated user's ID from the middleware (req.user.id)
        const userId = req.user.id; 
        
        // 1. Fetch User Profile
        let user = await User.findById(userId).select('-password');

        if (!user) {
            // If the token is valid but the user was somehow deleted
            return res.status(404).json({ message: 'User not found.' });
        }

        // 2. Fetch User's Bookings
        const bookings = await Booking.find({ user: user._id })
            .populate('room', 'roomNumber type')
            .sort({ checkIn: -1 });

        // 3. Combine and respond
        // Ensure user.username is used for the name field, as per your User model
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
        console.error('Server Error fetching guest profile:', error.message);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

module.exports = router;