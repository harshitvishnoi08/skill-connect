import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Search.css';

export default function Search() {
  const { axios, user } = useContext(AuthContext);
  const [filters, setFilters] = useState({
    search: '',
    skills: '',
    college: '',
    year: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sending, setSending] = useState({});

  // Load all users on mount
  useEffect(() => {
    loadAllUsers();
  }, []);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/users');
      // Filter out current user
      const filtered = res.data.users.filter(u => u._id !== user?.id && u._id !== user?._id);
      setResults(filtered);
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const doSearch = async () => {
    setLoading(true);
    setSearched(true);
    
    const params = [];
    if (filters.skills) params.push(`skills=${encodeURIComponent(filters.skills)}`);
    if (filters.college) params.push(`college=${encodeURIComponent(filters.college)}`);
    if (filters.search) params.push(`search=${encodeURIComponent(filters.search)}`);
    if (filters.year) params.push(`year=${encodeURIComponent(filters.year)}`);
    
    try {
      const res = await axios.get(`/users?${params.join('&')}`);
      // Filter out current user
      const filtered = res.data.users.filter(u => u._id !== user?.id && u._id !== user?._id);
      setResults(filtered);
    } catch (err) {
      console.error('Error searching:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      doSearch();
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', skills: '', college: '', year: '' });
    setSearched(false);
    loadAllUsers();
  };

  const sendCollabRequest = async (userId) => {
    try {
      setSending(prev => ({ ...prev, [userId]: true }));
      await axios.post('/connections/request', { toUserId: userId });
      alert('✅ Collaboration request sent!');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request');
    } finally {
      setSending(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="search-container">
      {/* Search Header */}
      <div className="search-header">
        <h1>🔍 Find Collaborators</h1>
        <p>Search for students with specific skills and interests</p>
      </div>

      {/* Search Filters */}
      <div className="search-filters">
        <div className="filters-grid">
          <div className="filter-group">
            <label>🔎 Search by Name</label>
            <input
              type="text"
              placeholder="Enter name..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="filter-group">
            <label>💼 Skills</label>
            <input
              type="text"
              placeholder="e.g., React, Python, Node.js"
              value={filters.skills}
              onChange={e => setFilters(f => ({ ...f, skills: e.target.value }))}
              onKeyPress={handleKeyPress}
            />
            <span className="helper-text">Comma-separated</span>
          </div>

          <div className="filter-group">
            <label>🏫 College</label>
            <input
              type="text"
              placeholder="Enter college name..."
              value={filters.college}
              onChange={e => setFilters(f => ({ ...f, college: e.target.value }))}
              onKeyPress={handleKeyPress}
            />
          </div>

          <div className="filter-group">
            <label>📅 Year of Study</label>
            <select
              value={filters.year}
              onChange={e => setFilters(f => ({ ...f, year: e.target.value }))}
            >
              <option value="">All Years</option>
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

        <div className="filter-actions">
          <button onClick={doSearch} className="btn-search" disabled={loading}>
            {loading ? '🔄 Searching...' : '🔍 Search'}
          </button>
          <button onClick={clearFilters} className="btn-clear">
            ✕ Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      {searched && !loading && (
        <div className="results-count">
          Found <strong>{results.length}</strong> {results.length === 1 ? 'person' : 'people'}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="search-loading">
          <div className="spinner"></div>
          <p>Searching...</p>
        </div>
      )}

      {/* Results Grid */}
      {!loading && results.length > 0 && (
        <div className="results-grid">
          {results.map(person => (
            <div key={person._id} className="user-result-card">
              <Link to={`/profile/${person._id}`} className="card-link">
                <img 
                  src={person.profilePicture} 
                  alt={person.name}
                  className="result-avatar"
                />
                <h3>{person.name}</h3>
                <p className="result-college">{person.college}</p>
                {person.year && (
                  <p className="result-year">{person.year}</p>
                )}
              </Link>

              <div className="result-skills">
                {person.skills?.slice(0, 3).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
                {person.skills?.length > 3 && (
                  <span className="skill-tag more">+{person.skills.length - 3}</span>
                )}
              </div>

              <div className="result-stats">
                <span>📁 {person.projects?.length || 0}</span>
                <span>🏆 {person.achievements?.length || 0}</span>
              </div>

              <div className="result-actions">
                <Link 
                  to={`/profile/${person._id}`} 
                  className="btn-view"
                >
                  👁️ View Profile
                </Link>
                <button 
                  onClick={() => sendCollabRequest(person._id)}
                  disabled={sending[person._id]}
                  className="btn-collab-small"
                >
                  {sending[person._id] ? '⏳' : '🤝'} Collab
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && searched && results.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <h3>No results found</h3>
          <p>Try adjusting your filters or search terms</p>
          <button onClick={clearFilters} className="btn-primary">
            Show All Users
          </button>
        </div>
      )}

      {/* Initial State */}
      {!loading && !searched && results.length > 0 && (
        <div className="initial-message">
          <p>💡 <strong>Tip:</strong> Use filters to find collaborators with specific skills or from your college</p>
        </div>
      )}
    </div>
  );
}