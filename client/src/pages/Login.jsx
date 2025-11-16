import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [restoreData, setRestoreData] = useState(null);
  const { axios, login } = useContext(AuthContext);
  const nav = useNavigate();

  // Load remembered email on component mount
  React.useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setForm(f => ({ ...f, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateDaysRemaining = (deletedAt) => {
    if (!deletedAt) return 0;
    const now = new Date();
    const deleted = new Date(deletedAt);
    const fiveDaysInMs = 5 * 24 * 60 * 60 * 1000;
    const timeRemaining = fiveDaysInMs - (now - deleted);
    return Math.max(0, Math.ceil(timeRemaining / (24 * 60 * 60 * 1000)));
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const res = await axios.post('/auth/login', form);
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      
      login(res.data.token, res.data.user);
      nav('/');
    } catch (err) {
      // Check if account is deleted and can be restored
      if (err.response?.status === 403 && err.response?.data?.canRestore) {
        setRestoreData({
          deletedAt: err.response.data.deletedAt,
          daysRemaining: calculateDaysRemaining(err.response.data.deletedAt)
        });
        setShowRestorePrompt(true);
        setErrors({});
      } else if (err.response?.status === 410) {
        setErrors({ 
          submit: 'Your account has been permanently deleted and cannot be restored.' 
        });
      } else {
        setErrors({ 
          submit: err.response?.data?.message || 'Login failed. Please try again.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    setErrors({});
    
    try {
      const res = await axios.post('/auth/restore-account', {
        email: form.email,
        password: form.password
      });
      
      // Save email if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', form.email);
      }
      
      login(res.data.token, res.data.user);
      
      // Show success message
      setTimeout(() => {
        alert('✅ Welcome back! Your account has been restored successfully.');
        nav('/');
      }, 100);
      
    } catch (err) {
      setErrors({ 
        submit: err.response?.data?.message || 'Error restoring account. Please try again.' 
      });
      setShowRestorePrompt(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRestore = () => {
    setShowRestorePrompt(false);
    setRestoreData(null);
    setForm({ email: '', password: '' });
    setErrors({});
  };

  // Restore prompt view
  if (showRestorePrompt && restoreData) {
    return (
      <div className="login-container">
        <div className="login-card restore-card">
          <div className="restore-header">
            <div className="restore-icon">♻️</div>
            <h2>Restore Your Account</h2>
            <p>Your account was scheduled for deletion</p>
          </div>
          
          <div className="restore-info">
            <div className="info-item">
              <span className="info-icon">⏰</span>
              <div className="info-content">
                <strong>Time Remaining</strong>
                <p>{restoreData.daysRemaining} day{restoreData.daysRemaining !== 1 ? 's' : ''} left to restore</p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-icon">📧</span>
              <div className="info-content">
                <strong>Account Email</strong>
                <p>{form.email}</p>
              </div>
            </div>
            
            <div className="info-item">
              <span className="info-icon">📦</span>
              <div className="info-content">
                <strong>What Gets Restored</strong>
                <p>All projects, achievements & connections</p>
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}
          
          <div className="restore-actions">
            <button 
              onClick={handleRestore} 
              disabled={loading}
              className="restore-btn"
            >
              {loading ? 'Restoring...' : '✅ Yes, Restore My Account'}
            </button>
            
            <button 
              onClick={handleCancelRestore}
              disabled={loading}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
          
          <div className="restore-note">
            💡 Your account will be fully restored with all your data intact.
          </div>
        </div>
      </div>
    );
  }

  // Normal login view
  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Please login to your account</p>
        </div>
        
        <form onSubmit={submit} className="login-form">
          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className={errors.email ? 'input-error' : ''}
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className={errors.password ? 'input-error' : ''}
              disabled={loading}
              autoComplete="current-password"
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
          </div>
          
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
            <Link to="/forgot-password" className="forgot-link">
              Forgot Password?
            </Link>
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <div className="login-footer">
          <p>
            Don't have an account? 
            <Link to="/register" className="register-link"> Create Account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}