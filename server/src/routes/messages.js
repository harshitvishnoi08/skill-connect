const express = require('express');
const auth = require('../middleware/auth');
const Message = require('../models/Message');

const router = express.Router();

// fetch chat between authenticated user and :userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const otherId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: otherId },
        { from: otherId, to: req.user._id }
      ]
    }).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
