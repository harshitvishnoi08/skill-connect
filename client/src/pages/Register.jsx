import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import './Register.css';

export default function Register() {
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    college: '',
    year: '1st Year',
    skills: '' 
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { axios, login } = useContext(AuthContext);
  const nav = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    
    // Name validation
    if (!form.name) {
      newErrors.name = 'Name is required';
    } else if (form.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    
    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    // Confirm password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // College validation
    if (!form.college) {
      newErrors.college = 'College/University is required';
    }
    
    // Skills validation
    if (!form.skills) {
      newErrors.skills = 'Please add at least one skill';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      // Convert skills string to array
      const skillsArray = form.skills.split(',').map(s => s.trim()).filter(s => s);
      
      const res = await axios.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        college: form.college,
        year: form.year,
        skills: skillsArray
      });
      
      login(res.data.token, res.data.user);
      nav('/');
    } catch (err) {
      console.error('Registration error:', err.response || err);
      
      // Show detailed error message
      let errorMessage = 'Registration failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Create Account</h2>
          <p>Join SkillConnect today</p>
        </div>
        
        <form onSubmit={submit} className="register-form">
          {errors.submit && (
            <div className="error-banner">{errors.submit}</div>
          )}
          
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              placeholder="Enter your full name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className={errors.name ? 'input-error' : ''}
              disabled={loading}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>
          
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
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Min. 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className={errors.password ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter password"
                value={form.confirmPassword}
                onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))}
                className={errors.confirmPassword ? 'input-error' : ''}
                disabled={loading}
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="college">College/University</label>
            <input
              id="college"
              type="text"
              placeholder="Enter your college name"
              value={form.college}
              onChange={e => setForm(f => ({ ...f, college: e.target.value }))}
              className={errors.college ? 'input-error' : ''}
              disabled={loading}
            />
            {errors.college && <span className="error-text">{errors.college}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="year">Year of Study</label>
            <select
              id="year"
              value={form.year}
              onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
              disabled={loading}
              style={{
                padding: '12px 16px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '15px',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: loading ? '#f7fafc' : 'white'
              }}
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
          
          <div className="form-group">
            <label htmlFor="skills">Skills</label>
            <input
              id="skills"
              type="text"
              placeholder="e.g., React, Node.js, Python (comma-separated)"
              value={form.skills}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              className={errors.skills ? 'input-error' : ''}
              disabled={loading}
            />
            {errors.skills && <span className="error-text">{errors.skills}</span>}
            <span className="helper-text">Separate multiple skills with commas</span>
          </div>
          
          <button type="submit" className="register-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="register-footer">
          <p>
            Already have an account? 
            <Link to="/login" className="login-link"> Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}