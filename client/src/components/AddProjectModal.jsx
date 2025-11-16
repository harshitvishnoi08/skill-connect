import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './Modal.css';

export default function AddProjectModal({ project, onClose, onSuccess }) {
  const { axios } = useContext(AuthContext);
  const isEditing = !!project;
  
  const [form, setForm] = useState({
    title: project?.title || '',
    description: project?.description || '',
    techStack: project?.techStack?.join(', ') || '',
    githubLink: project?.githubLink || '',
    liveLink: project?.liveLink || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) newErrors.title = 'Project title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.techStack.trim()) newErrors.techStack = 'Tech stack is required';
    if (!form.githubLink.trim()) newErrors.githubLink = 'GitHub link is required';
    
    // Validate GitHub URL
    if (form.githubLink && !form.githubLink.includes('github.com')) {
      newErrors.githubLink = 'Please enter a valid GitHub URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const techStackArray = form.techStack.split(',').map(s => s.trim()).filter(s => s);
      
      const data = {
        title: form.title,
        description: form.description,
        techStack: techStackArray,
        githubLink: form.githubLink,
        liveLink: form.liveLink
      };
      
      if (isEditing) {
        await axios.put(`/users/me/projects/${project._id}`, data);
        alert('✅ Project updated successfully!');
      } else {
        await axios.post('/users/me/projects', data);
        alert('✅ Project added successfully!');
      }
      
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? '✏️ Edit Project' : '➕ Add New Project'}</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Project Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., E-commerce Platform"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your project, what it does, and what problem it solves..."
              rows="4"
              className={errors.description ? 'input-error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>
          
          <div className="form-group">
            <label>Tech Stack * (comma-separated)</label>
            <input
              type="text"
              value={form.techStack}
              onChange={e => setForm(f => ({ ...f, techStack: e.target.value }))}
              placeholder="e.g., React, Node.js, MongoDB, Express"
              className={errors.techStack ? 'input-error' : ''}
            />
            {errors.techStack && <span className="error-text">{errors.techStack}</span>}
            <span className="helper-text">Separate technologies with commas</span>
          </div>
          
          <div className="form-group">
            <label>GitHub Repository Link *</label>
            <input
              type="url"
              value={form.githubLink}
              onChange={e => setForm(f => ({ ...f, githubLink: e.target.value }))}
              placeholder="https://github.com/username/project"
              className={errors.githubLink ? 'input-error' : ''}
            />
            {errors.githubLink && <span className="error-text">{errors.githubLink}</span>}
          </div>
          
          <div className="form-group">
            <label>Live Demo Link (Optional)</label>
            <input
              type="url"
              value={form.liveLink}
              onChange={e => setForm(f => ({ ...f, liveLink: e.target.value }))}
              placeholder="https://yourproject.com"
            />
            <span className="helper-text">Leave blank if not deployed</span>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Saving...' : isEditing ? 'Update Project' : 'Add Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}