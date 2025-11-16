const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true
  },
  techStack: {
    type: [String],
    required: [true, 'Tech stack is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one technology is required'
    }
  },
  githubLink: {
    type: String,
    required: [true, 'GitHub link is required'],
    trim: true
  },
  liveLink: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const achievementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Achievement title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Achievement description is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Achievement date is required']
  },
  certificateLink: {
    type: String,
    required: [true, 'Certificate link is required'],
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  college: {
    type: String,
    required: [true, 'College is required'],
    trim: true
  },
  year: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Final Year', 'Graduate', 'Post Graduate'],
    default: '1st Year'
  },
  skills: {
    type: [String],
    default: []
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  profilePicture: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=User&background=667eea&color=fff&size=200'
  },
  projects: [projectSchema],
  achievements: [achievementSchema],
  socialLinks: {
    github: {
      type: String,
      trim: true,
      default: ''
    },
    linkedin: {
      type: String,
      trim: true,
      default: ''
    },
    portfolio: {
      type: String,
      trim: true,
      default: ''
    }
  },
  connections: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Soft delete functionality
  isDeleted: {
    type: Boolean,
    default: false,
    index: true  // Index for faster queries
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

// Indexes for better performance
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ isDeleted: 1, deletedAt: 1 });
userSchema.index({ skills: 1, isDeleted: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Soft delete method
userSchema.methods.softDelete = function(reason = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletionReason = reason;
  return this.save();
};

// Restore deleted account
userSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletionReason = null;
  return this.save();
};

// Check if account can be restored (within 5 days)
userSchema.methods.canRestore = function() {
  if (!this.isDeleted || !this.deletedAt) {
    return false;
  }
  
  const now = new Date();
  const deletionDate = new Date(this.deletedAt);
  const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000; // 5 days in milliseconds
  const timeSinceDeletion = now - deletionDate;
  
  return timeSinceDeletion < fiveDaysInMs;
};

// Get days remaining for restoration
userSchema.methods.daysUntilPermanentDeletion = function() {
  if (!this.isDeleted || !this.deletedAt) {
    return null;
  }
  
  const now = new Date();
  const deletionDate = new Date(this.deletedAt);
  const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
  const timeSinceDeletion = now - deletionDate;
  const timeRemaining = fiveDaysInMs - timeSinceDeletion;
  
  if (timeRemaining <= 0) {
    return 0;
  }
  
  return Math.ceil(timeRemaining / (24 * 60 * 60 * 1000));
};

// Static method to permanently delete expired accounts
userSchema.statics.deleteExpiredAccounts = async function() {
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  
  const result = await this.deleteMany({
    isDeleted: true,
    deletedAt: { $lte: fiveDaysAgo }
  });
  
  console.log(`Permanently deleted ${result.deletedCount} expired accounts`);
  return result;
};

// Remove password and sensitive data from JSON response
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  
  if (obj.isDeleted) {
    // Hide most data if account is deleted
    return {
      _id: obj._id,
      isDeleted: true,
      deletedAt: obj.deletedAt,
      canRestore: this.canRestore(),
      message: 'This account has been deleted'
    };
  }
  
  return obj;
};

// Query helper to exclude deleted users by default
userSchema.query.active = function() {
  return this.where({ isDeleted: false });
};

// Virtual for profile completeness percentage
userSchema.virtual('profileCompleteness').get(function() {
  let score = 0;
  const totalFields = 10;
  
  if (this.name) score++;
  if (this.email) score++;
  if (this.college) score++;
  if (this.year) score++;
  if (this.bio && this.bio.length > 0) score++;
  if (this.skills && this.skills.length > 0) score++;
  if (this.profilePicture) score++;
  if (this.projects && this.projects.length > 0) score++;
  if (this.achievements && this.achievements.length > 0) score++;
  if (this.socialLinks && (this.socialLinks.github || this.socialLinks.linkedin || this.socialLinks.portfolio)) score++;
  
  return Math.round((score / totalFields) * 100);
});

// Ensure virtuals are included when converting to JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);