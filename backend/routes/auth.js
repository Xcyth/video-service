const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generatePassword, sendPasswordEmail } = require('../utils/emailService');

// Register a new user
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phoneNumber }]
    });
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email 
          ? 'Email already registered' 
          : 'Phone number already registered' 
      });
    }

    // Generate password using all user details
    const password = generatePassword(firstName, lastName, email, phoneNumber);

    // Create new user
    const user = new User({ firstName, lastName, email, phoneNumber, password });
    await user.save();

    // Send password via email
    const emailSent = await sendPasswordEmail(email, firstName, password);
    if (!emailSent) {
      // If email fails, delete the user and return error
      await User.findByIdAndDelete(user._id);
      return res.status(500).json({ error: 'Failed to send password email' });
    }

    res.status(201).json({ 
      message: 'Registration successful. Please check your email for login credentials.',
      user: { 
        id: user._id, 
        firstName, 
        lastName, 
        email,
        phoneNumber 
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { firstName, password } = req.body;
    
    // Find all users with the given firstName
    const users = await User.find({ firstName });
    
    if (!users || users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Try to find a user with matching password
    let matchedUser = null;
    for (const user of users) {
      const isMatch = await user.comparePassword(password);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ userId: matchedUser._id }, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    const profilePictureUrl = matchedUser.profilePicture 
      ? `/media/profile-pictures/${matchedUser.profilePicture}`
      : null;

    res.json({ 
      user: { 
        id: matchedUser._id, 
        firstName: matchedUser.firstName, 
        lastName: matchedUser.lastName, 
        email: matchedUser.email,
        bio: matchedUser.bio,
        profilePicture: matchedUser.profilePicture,
        profilePictureUrl: profilePictureUrl
      }, 
      token 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const profilePictureUrl = req.user.profilePicture 
      ? `/media/profile-pictures/${req.user.profilePicture}`
      : null;

    res.json({ 
      user: { 
        id: req.user._id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName, 
        email: req.user.email,
        bio: req.user.bio,
        profilePicture: req.user.profilePicture,
        profilePictureUrl: profilePictureUrl
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update user bio
router.put('/update-bio', auth, async (req, res) => {
  try {
    const { bio } = req.body;
    
    if (typeof bio !== 'string') {
      return res.status(400).json({ error: 'Bio must be a string' });
    }

    // Update user's bio
    req.user.bio = bio;
    await req.user.save();

    // Return updated user data
    const profilePictureUrl = req.user.profilePicture 
      ? `/media/profile-pictures/${req.user.profilePicture}`
      : null;

    res.json({ 
      user: { 
        id: req.user._id, 
        firstName: req.user.firstName, 
        lastName: req.user.lastName, 
        email: req.user.email,
        bio: req.user.bio,
        profilePicture: req.user.profilePicture,
        profilePictureUrl: profilePictureUrl
      } 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router; 