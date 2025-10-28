const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// GET /api/users?skills=React,Node&college=XYZ&lookingForTeam=true&search=shiv
router.get('/', auth, async (req, res) => {
  try {
    const { skills, college, lookingForTeam, search, page = 1, limit = 20 } = req.query;
    const q = {};
    if (skills) q.skills = { $all: skills.split(',').map(s => s.trim()) };
    if (college) q.college = college;
    if (typeof lookingForTeam !== 'undefined') q.lookingForTeam = lookingForTeam === 'true';
    if (search) q.$or = [
      { name: new RegExp(search, 'i') },
      { bio: new RegExp(search, 'i') },
      { skills: new RegExp(search, 'i') }
    ];
    // exclude self
    q._id = { $ne: req.user._id };
    const users = await User.find(q)
      .skip((page-1)*limit)
      .limit(parseInt(limit))
      .lean();
    const total = await User.countDocuments(q);
    res.json({ users, total, page: parseInt(page) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'Not found' });
    delete user.passwordHash;
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) return res.status(403).json({ message: 'Forbidden' });
    const allowed = ['name','college','year','skills','bio','projects','lookingForTeam','socialLinks','avatarUrl'];
    const toUpdate = {};
    for (const k of allowed) if (k in req.body) toUpdate[k] = req.body[k];
    const updated = await User.findByIdAndUpdate(req.params.id, toUpdate, { new: true }).lean();
    delete updated.passwordHash;
    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
