const express = require('express');
const auth = require('../middleware/auth');
const ConnectionRequest = require('../models/ConnectionRequest');

const router = express.Router();

router.post('/request', auth, async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ message: 'Missing toUserId' });
    // prevent duplicate pending
    const exists = await ConnectionRequest.findOne({ fromUser: req.user._id, toUser: toUserId, status: 'pending' });
    if (exists) return res.status(400).json({ message: 'Request already sent' });
    const reqDoc = await ConnectionRequest.create({ fromUser: req.user._id, toUser: toUserId });
    res.json(reqDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/respond', auth, async (req, res) => {
  try {
    const { requestId, action } = req.body; // action: accept | reject
    if (!requestId || !['accept','reject'].includes(action)) return res.status(400).json({ message: 'Invalid' });
    const reqDoc = await ConnectionRequest.findById(requestId);
    if (!reqDoc) return res.status(404).json({ message: 'Not found' });
    if (reqDoc.toUser.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
    reqDoc.status = action === 'accept' ? 'accepted' : 'rejected';
    await reqDoc.save();
    res.json(reqDoc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const incoming = await ConnectionRequest.find({ toUser: req.user._id, status: 'pending' }).populate('fromUser','name college skills');
    const outgoing = await ConnectionRequest.find({ fromUser: req.user._id }).populate('toUser','name college skills');
    res.json({ incoming, outgoing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
