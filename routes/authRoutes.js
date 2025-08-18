const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose'); // <-- important for ObjectId checks
const User = require('../models/users'); // your Mongoose model

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user with username & password
 */
// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ message: 'Username, password, and role are required' });
    }

    if (!['guest','receptionist','admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'Username already taken' });
    }


    const newUser = new User({
      username,
      password,
      role
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user by username OR email
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body; // <-- use username now

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.status(200).json({
      message: 'Login successful!',
      role: user.role
    });

  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


router.get('/admin/users', async (req, res) => {
  try {
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




module.exports = router;
