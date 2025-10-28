const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: String,
  description: String,
  link: String,
  images: [String]
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true },
  passwordHash: { type: String, required: true },
  college: String,
  year: String,
  skills: [String],
  bio: String,
  projects: [ProjectSchema],
  lookingForTeam: { type: Boolean, default: false },
  socialLinks: {
    github: String,
    linkedin: String
  },
  avatarUrl: String
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
