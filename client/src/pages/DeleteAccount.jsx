import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './DeleteAccount.css';

export default function DeleteAccount() {
  const { axios, logout } = useContext(AuthContext);
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    
    if (!password) {
      setError('Please enter your password to confirm');
      return;
    }
    
    if (!confirmed) {
      setError('Please confirm that you understand this action cannot be undone');
      return;
    }
    
    if (!window.confirm('⚠️ FINAL WARNING: Are you absolutely sure you want to delete your account? This cannot be undone!')) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      await axios.post('/auth/delete-account', { password, reason });
      
      alert('✅ Account deleted successfully. You have 5 days to restore it if you change your mind.');
      logout();
      nav('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting account. Please check your password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="delete-account-container">
      <div className="delete-account-card">
        <div className="warning-header">
          <span className="warning-icon">⚠️</span>
          <h1>Delete Account</h1>
        </div>
        
        <div className="warning-message">
          <h3>⚠️ This action is permanent!</h3>
          <p>Deleting your account will:</p>
          <ul>
            <li>❌ Remove all your projects and achievements</li>
            <li>❌ Delete all your connections</li>
            <li>❌ Cancel all pending collaboration requests</li>
            <li>❌ Remove your profile from search results</li>
            <li>⏰ Give you 5 days to restore your account</li>
            <li>🗑️ Permanently delete everything after 5 days</li>
          </ul>
        </div>

        <form onSubmit={handleDelete} className="delete-form">
          {error && (
            <div className="error-banner">{error}</div>
          )}
          
          <div className="form-group">
            <label>Reason for Leaving (Optional)</label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
            >
              <option value="">Select a reason...</option>
              <option value="not_useful">Not useful for me</option>
              <option value="privacy">Privacy concerns</option>
              <option value="found_alternative">Found alternative</option>
              <option value="too_many_emails">Too many notifications</option>
              <option value="temporary">Taking a break</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password to confirm"
              required
            />
            <span className="helper-text">We need to verify it's really you</span>
          </div>
          
          <div className="confirmation-box">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={e => setConfirmed(e.target.checked)}
                required
              />
              <span>
                I understand this action <strong>cannot be undone</strong> and all my data will be deleted after 5 days
              </span>
            </label>
          </div>
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={() => nav('/dashboard')} 
              className="btn-cancel"
            >
              ← Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !confirmed}
              className="btn-delete"
            >
              {loading ? 'Deleting...' : '🗑️ Delete My Account'}
            </button>
          </div>
        </form>
        
        <div className="restore-info">
          <h4>💡 Changed your mind?</h4>
          <p>You have <strong>5 days</strong> to restore your account after deletion. Just login with your email and password within 5 days.</p>
        </div>
      </div>
    </div>
  );
}