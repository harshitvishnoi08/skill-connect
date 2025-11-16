import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import './Modal.css';

export default function AddAchievementModal({ achievement, onClose, onSuccess }) {
  const { axios } = useContext(AuthContext);
  const isEditing = !!achievement;
  
  const [form, setForm] = useState({
    title: achievement?.title || '',
    description: achievement?.description || '',
    date: achievement?.date ? new Date(achievement.date).toISOString().split('T')[0] : '',
    certificateLink: achievement?.certificateLink || ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.title.trim()) newErrors.title = 'Achievement title is required';
    if (!form.description.trim()) newErrors.description = 'Description is required';
    if (!form.date) newErrors.date = 'Date is required';
    if (!form.certificateLink.trim()) newErrors.certificateLink = 'Certificate link is required';
    
    // Validate date is not in future
    if (form.date && new Date(form.date) > new Date()) {
      newErrors.date = 'Date cannot be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const data = {
        title: form.title,
        description: form.description,
        date: form.date,
        certificateLink: form.certificateLink
      };
      
      if (isEditing) {
        await axios.put(`/users/me/achievements/${achievement._id}`, data);
        alert('✅ Achievement updated successfully!');
      } else {
        await axios.post('/users/me/achievements', data);
        alert('✅ Achievement added successfully!');
      }
      
      onSuccess();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving achievement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? '✏️ Edit Achievement' : '🏆 Add New Achievement'}</h2>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Achievement Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g., Winner - Smart India Hackathon 2024"
              className={errors.title ? 'input-error' : ''}
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>
          
          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Describe your achievement, what you did, and the impact..."
              rows="4"
              className={errors.description ? 'input-error' : ''}
            />
            {errors.description && <span className="error-text">{errors.description}</span>}
          </div>
          
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              className={errors.date ? 'input-error' : ''}
            />
            {errors.date && <span className="error-text">{errors.date}</span>}
          </div>
          
          <div className="form-group">
            <label>Certificate Link *</label>
            <input
              type="url"
              value={form.certificateLink}
              onChange={e => setForm(f => ({ ...f, certificateLink: e.target.value }))}
              placeholder="https://drive.google.com/... or certificate URL"
              className={errors.certificateLink ? 'input-error' : ''}
            />
            {errors.certificateLink && <span className="error-text">{errors.certificateLink}</span>}
            <span className="helper-text">Upload certificate to Google Drive or any cloud storage and paste the link</span>
          </div>
          
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-submit">
              {loading ? 'Saving...' : isEditing ? 'Update Achievement' : 'Add Achievement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}