const express = require('express');
const router = express.Router();
const Connection = require('../models/Connection');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Send collaboration request
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { toUserId, message } = req.body;
    
    if (!toUserId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    // Can't send request to yourself
    if (toUserId === req.userId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }
    
    // Check if target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser || targetUser.isDeleted) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if request already exists
    const existingRequest = await Connection.findOne({
      from: req.userId,
      to: toUserId
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return res.status(400).json({ message: 'Request already sent' });
      }
      if (existingRequest.status === 'accepted') {
        return res.status(400).json({ message: 'Already connected' });
      }
      // If rejected, allow sending again
      existingRequest.status = 'pending';
      existingRequest.message = message || '';
      existingRequest.createdAt = new Date();
      existingRequest.respondedAt = null;
      await existingRequest.save();
      
      return res.json({ message: 'Request sent successfully', request: existingRequest });
    }
    
    // Create new request
    const connection = new Connection({
      from: req.userId,
      to: toUserId,
      message: message || '',
      status: 'pending'
    });
    
    await connection.save();
    
    res.status(201).json({ message: 'Request sent successfully', request: connection });
  } catch (error) {
    res.status(500).json({ message: 'Error sending request', error: error.message });
  }
});

// Get received requests (pending)
router.get('/requests/received', authMiddleware, async (req, res) => {
  try {
    const requests = await Connection.find({
      to: req.userId,
      status: 'pending'
    })
    .populate('from', 'name email college year skills profilePicture projects achievements')
    .sort({ createdAt: -1 });
    
    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
});

// Get sent requests
router.get('/requests/sent', authMiddleware, async (req, res) => {
  try {
    const requests = await Connection.find({
      from: req.userId
    })
    .populate('to', 'name email college year skills profilePicture')
    .sort({ createdAt: -1 });
    
    res.json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sent requests', error: error.message });
  }
});

// Get all connections (accepted)
router.get('/my-connections', authMiddleware, async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [
        { from: req.userId, status: 'accepted' },
        { to: req.userId, status: 'accepted' }
      ]
    })
    .populate('from', 'name email college year skills profilePicture')
    .populate('to', 'name email college year skills profilePicture')
    .sort({ respondedAt: -1 });
    
    // Format response to show the other user
    const formattedConnections = connections.map(conn => {
      const otherUser = conn.from._id.toString() === req.userId 
        ? conn.to 
        : conn.from;
      
      return {
        _id: conn._id,
        user: otherUser,
        connectedAt: conn.respondedAt,
        status: conn.status
      };
    });
    
    res.json({ count: formattedConnections.length, connections: formattedConnections });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching connections', error: error.message });
  }
});

// Accept connection request
router.post('/accept/:requestId', authMiddleware, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.requestId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Only the recipient can accept
    if (connection.to.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to accept this request' });
    }
    
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }
    
    connection.status = 'accepted';
    connection.respondedAt = new Date();
    await connection.save();
    
    // Add to both users' connections array
    await User.findByIdAndUpdate(connection.from, {
      $addToSet: { connections: connection.to }
    });
    
    await User.findByIdAndUpdate(connection.to, {
      $addToSet: { connections: connection.from }
    });
    
    res.json({ message: 'Connection accepted successfully', connection });
  } catch (error) {
    res.status(500).json({ message: 'Error accepting request', error: error.message });
  }
});

// Reject connection request
router.post('/reject/:requestId', authMiddleware, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.requestId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Only the recipient can reject
    if (connection.to.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to reject this request' });
    }
    
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Request already processed' });
    }
    
    connection.status = 'rejected';
    connection.respondedAt = new Date();
    await connection.save();
    
    res.json({ message: 'Connection rejected', connection });
  } catch (error) {
    res.status(500).json({ message: 'Error rejecting request', error: error.message });
  }
});

// Cancel sent request
router.delete('/cancel/:requestId', authMiddleware, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.requestId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    // Only the sender can cancel
    if (connection.from.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to cancel this request' });
    }
    
    if (connection.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }
    
    await connection.deleteOne();
    
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling request', error: error.message });
  }
});

// Remove connection
router.delete('/remove/:connectionId', authMiddleware, async (req, res) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    
    if (!connection) {
      return res.status(404).json({ message: 'Connection not found' });
    }
    
    // Check if user is part of this connection
    const isFrom = connection.from.toString() === req.userId;
    const isTo = connection.to.toString() === req.userId;
    
    if (!isFrom && !isTo) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Remove from both users' connections arrays
    await User.findByIdAndUpdate(connection.from, {
      $pull: { connections: connection.to }
    });
    
    await User.findByIdAndUpdate(connection.to, {
      $pull: { connections: connection.from }
    });
    
    await connection.deleteOne();
    
    res.json({ message: 'Connection removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing connection', error: error.message });
  }
});

module.exports = router;