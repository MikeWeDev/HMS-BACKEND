const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require('../models/users'); // Ensure this points to the updated User model

const router = express.Router();

const generateDemoCredentials = (role) => {
    // Generate a simple unique identifier
    const uniqueId = new mongoose.Types.ObjectId().toHexString().substring(0, 6);
    const username = `${role.toUpperCase()}_DEMO_${uniqueId}`;
    const email = `${role.toLowerCase()}${uniqueId}@hmsdemo.com`;
    const password = 'Password123!'; // A fixed password for demo accounts
    
    return { username, email, password };
};



router.post('/register', async (req, res) => {
	try {
		// New fields included: email and phone
		const { username, password, role, email, phone } = req.body;

		// Validation check: email is now required
		if (!username || !password || !role || !email) {
			return res.status(400).json({ message: 'Username, email, password, and role are required' });
		}

		if (!['guest', 'receptionist', 'admin'].includes(role)) {
			return res.status(400).json({ message: 'Invalid role selected' });
		}

		// Check for existing username
		let existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(409).json({ message: 'Username already taken' });
		}

		// Check for existing email (since it's unique in the schema)
		existingUser = await User.findOne({ email });
		if (existingUser) {
			return res.status(409).json({ message: 'Email address already registered' });
		}

		// Create new user with profile fields
		const newUser = new User({
			username,
			password,
			role,
			email,
			phone: phone || null, // phone is optional
			// loyaltyPoints defaults to 0 as per the model schema
		});

		await newUser.save();
		res.status(201).json({ message: 'User registered successfully!' });
	} catch (error) {
		console.error('Registration error:', error);
		// Check for specific MongoDB validation errors if the general catch is too broad
		if (error.name === 'ValidationError') {
			return res.status(400).json({ message: error.message });
		}
		res.status(500).json({ message: 'Internal server error' });
	}
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user by username OR email (using username for now as per provided code)
 */
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare passwords
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // 🔑 CRITICAL CHANGE: Generate and return the JWT
        res.status(200).json({
            message: 'Login successful!',
            role: user.role,
            userId: user._id,
           
        });

    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/admin/users', async (req, res) => {
	try {
		// Middleware to check for admin role would typically be added here
		const users = await User.find({}, { password: 0, __v: 0 }).lean(); // exclude password
		res.json({ data: users, totalItems: users.length });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Failed to fetch users', error: String(err) });
	}
});

/** DELETE user by ID */
router.delete('/admin/users/:id', async (req, res) => {
	try {
		const { id } = req.params;
		if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid user ID' });

		const deleted = await User.findByIdAndDelete(id);
		if (!deleted) return res.status(404).json({ message: 'User not found' });

		res.json({ message: 'User deleted successfully', userId: id });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Failed to delete user', error: String(err) });
	}
});

router.post('/demo-login', async (req, res) => {
    const { role } = req.body; // Expects 'guest', 'receptionist', or 'admin'
    
    // Define a FIXED, unique username for persistent demo accounts
    const DEMO_USERNAME = `${role.toUpperCase()}_FIXED_DEMO`; 
    
    // 1. Validate the role
    const validRoles = ['guest', 'receptionist', 'admin'];
    if (!role || !validRoles.includes(role)) {
        return res.status(400).json({ message: 'Invalid or missing role for demo login.' });
    }
    
    try {
        // 2. TRY TO FIND THE FIXED DEMO USER
        let user = await User.findOne({ username: DEMO_USERNAME });

        if (!user) {
            // 3. IF NOT FOUND, CREATE IT (This happens only once)
            console.log(`Creating new fixed demo user: ${DEMO_USERNAME}`);
            
            const demoEmail = `${role.toLowerCase()}-fixed-demo@hms.com`;
            const demoPassword = 'FixedDemoPassword123!'; // Your desired fixed password
            const loyaltyPoints = role === 'guest' ? 500 : 0; 
            
            user = await User.create({
                username: DEMO_USERNAME,
                email: demoEmail,
                password: demoPassword, // Hashed by the model pre-save hook
                role,
                phone: '555-FIXED-DEMO',
                loyaltyPoints,
            });
        } else {
            console.log(`Reusing existing fixed demo user: ${DEMO_USERNAME}`);
        }

        // 4. Respond with the FIXED user ID
        res.status(200).json({
            message: `Logged in as fixed demo ${role} user.`,
            userId: user._id, // The same MongoDB _id every time
            role: user.role,
        });

    } catch (error) {
        console.error(`Demo login error for role ${role}:`, error);
        res.status(500).json({ message: 'Server error during demo login.' });
    }
});
module.exports = router;
