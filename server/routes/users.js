const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Get all users (with optional filters)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { skills, college, year, search } = req.query;
    
    let query = { isDeleted: false };
    
    // Filter by skills
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }
    
    // Filter by college
    if (college) {
      query.college = new RegExp(college, 'i'); // Case-insensitive
    }
    
    // Filter by year
    if (year) {
      query.year = year;
    }
    
    // Search by name
    if (search) {
      query.name = new RegExp(search, 'i');
    }
    
    const users = await User.find(query)
      .select('-password')
      .limit(50)
      .sort({ createdAt: -1 });
    
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
});

// Get single user by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('connections', 'name email college profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isDeleted) {
      return res.status(410).json({ message: 'This account has been deleted' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user', error: error.message });
  }
});

// Get current user profile
router.get('/me/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('connections', 'name email college profilePicture');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile', error: error.message });
  }
});

// Update user profile - FIXED VERSION
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, college, year, skills, bio, profilePicture, socialLinks } = req.body;
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update fields
    if (name) user.name = name;
    if (college) user.college = college;
    if (year) user.year = year;
    if (skills) user.skills = skills;
    if (bio !== undefined) user.bio = bio; // Allow empty string
    if (profilePicture !== undefined) user.profilePicture = profilePicture; // Allow empty string
    
    // FIXED: Allow empty strings for social links
    if (socialLinks !== undefined) {
      user.socialLinks = {
        github: socialLinks.github !== undefined ? socialLinks.github : user.socialLinks.github,
        linkedin: socialLinks.linkedin !== undefined ? socialLinks.linkedin : user.socialLinks.linkedin,
        portfolio: socialLinks.portfolio !== undefined ? socialLinks.portfolio : user.socialLinks.portfolio
      };
    }
    
    await user.save();
    
    res.json({ message: 'Profile updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Error updating profile', error: error.message });
  }
});

// Add project
router.post('/me/projects', authMiddleware, async (req, res) => {
  try {
    const { title, description, techStack, githubLink, liveLink } = req.body;
    
    if (!title || !description || !techStack || !githubLink) {
      return res.status(400).json({ 
        message: 'Title, description, tech stack, and GitHub link are required' 
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.projects.push({
      title,
      description,
      techStack,
      githubLink,
      liveLink
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Project added successfully', 
      project: user.projects[user.projects.length - 1] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding project', error: error.message });
  }
});

// Update project
router.put('/me/projects/:projectId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const project = user.projects.id(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const { title, description, techStack, githubLink, liveLink } = req.body;
    
    if (title) project.title = title;
    if (description) project.description = description;
    if (techStack) project.techStack = techStack;
    if (githubLink) project.githubLink = githubLink;
    if (liveLink !== undefined) project.liveLink = liveLink;
    
    await user.save();
    
    res.json({ message: 'Project updated successfully', project });
  } catch (error) {
    res.status(500).json({ message: 'Error updating project', error: error.message });
  }
});

// Delete project
router.delete('/me/projects/:projectId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.projects.pull(req.params.projectId);
    await user.save();
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

// Add achievement
router.post('/me/achievements', authMiddleware, async (req, res) => {
  try {
    const { title, description, date, certificateLink } = req.body;
    
    if (!title || !description || !date || !certificateLink) {
      return res.status(400).json({ 
        message: 'All fields are required for achievement' 
      });
    }
    
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.achievements.push({
      title,
      description,
      date,
      certificateLink
    });
    
    await user.save();
    
    res.status(201).json({ 
      message: 'Achievement added successfully', 
      achievement: user.achievements[user.achievements.length - 1] 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding achievement', error: error.message });
  }
});

// Update achievement
router.put('/me/achievements/:achievementId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const achievement = user.achievements.id(req.params.achievementId);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }
    
    const { title, description, date, certificateLink } = req.body;
    
    if (title) achievement.title = title;
    if (description) achievement.description = description;
    if (date) achievement.date = date;
    if (certificateLink) achievement.certificateLink = certificateLink;
    
    await user.save();
    
    res.json({ message: 'Achievement updated successfully', achievement });
  } catch (error) {
    res.status(500).json({ message: 'Error updating achievement', error: error.message });
  }
});

// Delete achievement
router.delete('/me/achievements/:achievementId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.achievements.pull(req.params.achievementId);
    await user.save();
    
    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting achievement', error: error.message });
  }
});

module.exports = router;