const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// JWT Secret (should be in .env file)
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this';

// Register Route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, college, skills } = req.body;

    // Validate required fields
    if (!name || !email || !password || !college) {
      return res.status(400).json({ 
        message: 'Please provide all required fields: name, email, password, and college' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      name,
      college,
      skills: skills || []
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user (including deleted ones for restoration check)
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is deleted
    if (user.isDeleted) {
      // Check if can be restored
      if (user.canRestore()) {
        return res.status(403).json({ 
          message: 'Your account is scheduled for deletion. Would you like to restore it?',
          canRestore: true,
          deletedAt: user.deletedAt
        });
      } else {
        return res.status(410).json({ 
          message: 'Your account has been permanently deleted.' 
        });
      }
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Get Current User (Protected Route)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if account is deleted
    if (user.isDeleted) {
      return res.status(403).json({ 
        message: 'Account is deleted',
        canRestore: user.canRestore()
      });
    }
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Logout Route (Optional - mainly client-side)
router.post('/logout', authMiddleware, (req, res) => {
  // In a real app, you might want to blacklist the token
  res.json({ message: 'Logout successful' });
});

// DELETE ACCOUNT (Soft Delete with Password Verification)
router.post('/delete-account', authMiddleware, async (req, res) => {
  try {
    const { password, reason } = req.body;
    const userId = req.userId;

    // Validate password is provided
    if (!password) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already deleted
    if (user.isDeleted) {
      return res.status(400).json({ message: 'Account is already deleted' });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    // Soft delete the account
    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletionReason = reason || 'Not specified';
    await user.save();

    // Remove user from all connections
    await User.updateMany(
      { connections: userId },
      { $pull: { connections: userId } }
    );

    // Delete all connection requests (if you have a Connection model)
    try {
      const Connection = require('../models/Connection');
      await Connection.deleteMany({
        $or: [{ from: userId }, { to: userId }]
      });
    } catch (err) {
      console.log('No Connection model found, skipping connection cleanup');
    }

    res.json({ 
      message: 'Account deleted successfully. You have 5 days to restore it by logging in again.',
      deletedAt: user.deletedAt,
      restoreDeadline: new Date(user.deletedAt.getTime() + 5 * 24 * 60 * 60 * 1000)
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Error deleting account', error: error.message });
  }
});

// RESTORE DELETED ACCOUNT
router.post('/restore-account', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find deleted user
    const user = await User.findOne({ email, isDeleted: true });

    if (!user) {
      return res.status(404).json({ 
        message: 'No deleted account found with this email' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    // Check if within 5-day restoration window
    if (!user.canRestore()) {
      return res.status(410).json({ 
        message: 'Account recovery period has expired (5 days). Account cannot be restored.' 
      });
    }

    // Restore account
    await user.restore();

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate new JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Account restored successfully! Welcome back!',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Restore account error:', error);
    res.status(500).json({ message: 'Error restoring account', error: error.message });
  }
});

module.exports = router;