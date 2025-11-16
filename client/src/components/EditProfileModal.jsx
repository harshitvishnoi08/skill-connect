import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './Modal.css';

export default function EditProfileModal({ profile, onClose, onSuccess }) {
  const { axios } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: profile.name || '',
    college: profile.college || '',
    year: profile.year || '1st Year',
    bio: profile.bio || '',
    skills: profile.skills?.join(', ') || '',
    profilePicture: profile.profilePicture || '',
    github: profile.socialLinks?.github || '',
    linkedin: profile.socialLinks?.linkedin || '',
    portfolio: profile.socialLinks?.portfolio || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.college.trim()) newErrors.college = 'College is required';
    if (!form.skills.trim()) newErrors.skills = 'At least one skill is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(s => s);
      
      await axios.put('/users/me', {
        name: form.name,
        college: form.college,
        year: form.year,
        bio: form.bio,
        skills: skillsArray,
        profilePicture: form.profilePicture,
        socialLinks: {
          github: form.github,
          linkedin: form.linkedin,
          portfolio: form.portfolio
        }
      });
      
      alert('✅ Profile updated successfully!');
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>✏️ Edit Profile</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={errors.name ? 'input-error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>College/University *</label>
              <input
                type="text"
                value={form.college}
                onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
                className={errors.college ? 'input-error' : ''}
              />
              {errors.college && <span className="error-text">{errors.college}</span>}
            </div>
            
            <div className="form-group">
              <label>Year of Study *</label>
              <select
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Final Year">Final Year</option>
                <option value="Graduate">Graduate</option>
                <option value="Post Graduate">Post Graduate</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              placeholder="Tell us about yourself..."
              rows="3"
              maxLength="500"
            />
            <span className="helper-text">{form.bio.length}/500 characters</span>
          </div>
          
          <div className="form-group">
            <label>Skills * (comma-separated)</label>
            <input
              type="text"
              value={form.skills}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              placeholder="e.g., React, Node.js, Python"
              className={errors.skills ? 'input-error' : ''}
            />
            {errors.skills && <span className="error-text">{errors.skills}</span>}
          </div>
          
          <div className="form-group">
            <label>Profile Picture URL</label>
            <input
              type="url"
              value={form.profilePicture}
              onChange={e => setForm(f => ({ ...f, profilePicture: e.target.value }))}
              placeholder="https://example.com/photo.jpg"
            />
            <span className="helper-text">Leave blank to use auto-generated avatar</span>
          </div>
          
          <div className="form-divider">Social Links</div>
          
          <div className="form-group">
            <label>GitHub Profile</label>
            <input
              type="url"
              value={form.github}
              onChange={e => setForm(f => ({ ...f, github: e.target.value }))}
              placeholder="https://github.com/username"
            />
          </div>
          
          <div className="form-group">
            <label>LinkedIn Profile</label>
            <input
              type="url"
              value={form.linkedin}
              onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))}
              placeholder="https://linkedin.com/in/username"
            />
          </div>
          
          <div className="form-group">
            <label>Portfolio Website</label>
            <input
              type="url"
              value={form.portfolio}
              onChange={e => setForm(f => ({ ...f, portfolio: e.target.value }))}
              placeholder="https://yourportfolio.com"
            />
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}