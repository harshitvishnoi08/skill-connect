import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import ProfileCompleteness from '../components/ProfileCompleteness';
import './Dashboard.css';

export default function Dashboard() {
  const { axios, user } = useContext(AuthContext);
  const [recommendations, setRecommendations] = useState([]);
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [stats, setStats] = useState({ projects: 0, achievements: 0, connections: 0 });
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch current user profile
      const profileRes = await axios.get('/users/me/profile');
      const userData = profileRes.data;
      // Calculate stats
      setStats({
        projects: userData.projects?.length || 0,
        achievements: userData.achievements?.length || 0,
        connections: userData.connections?.length || 0
      });
      
      // Fetch recommendations (users with similar skills)
      if (userData.skills && userData.skills.length > 0) {
        const skillsQuery = userData.skills.slice(0, 3).join(',');
        const recsRes = await axios.get(`/users?skills=${encodeURIComponent(skillsQuery)}`);
        // Filter out current user
        const filtered = recsRes.data.users.filter(u => u._id !== userData._id);
        setRecommendations(filtered.slice(0, 6));
      }
      
      // Fetch pending connection requests
      const requestsRes = await axios.get('/connections/requests/received');
      setConnectionRequests(requestsRes.data.requests || []);
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await axios.post(`/connections/accept/${requestId}`);
      alert('Connection accepted!');
      fetchDashboardData(); // Refresh data
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await axios.post(`/connections/reject/${requestId}`);
      alert('Connection rejected');
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting request');
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Profile Completeness */}
      <ProfileCompleteness user={user} />

      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Welcome back, {user?.name}! 👋</h1>
            <p>{user?.college} • {user?.year}</p>
            <div className="hero-skills">
              {user?.skills?.slice(0, 5).map((skill, idx) => (
                <span key={idx} className="skill-badge">{skill}</span>
              ))}
            </div>
          </div>
          <div className="hero-actions">
            <Link to={`/profile/${user?.id || user?._id}`} className="btn-primary">
              View Profile
            </Link>
            <Link to="/search" className="btn-secondary">
              Find Collaborators
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon projects">📁</div>
          <div className="stat-info">
            <h3>{stats.projects}</h3>
            <p>Projects</p>
          </div>
          <Link to={`/profile/${user?.id || user?._id}`} className="stat-link">View →</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon achievements">🏆</div>
          <div className="stat-info">
            <h3>{stats.achievements}</h3>
            <p>Achievements</p>
          </div>
          <Link to={`/profile/${user?.id || user?._id}`} className="stat-link">View →</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon connections">🤝</div>
          <div className="stat-info">
            <h3>{stats.connections}</h3>
            <p>Connections</p>
          </div>
          <Link to="/connections" className="stat-link">Manage →</Link>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon requests">📬</div>
          <div className="stat-info">
            <h3>{connectionRequests.length}</h3>
            <p>Pending Requests</p>
          </div>
          {connectionRequests.length > 0 && (
            <span className="stat-badge">{connectionRequests.length} new</span>
          )}
        </div>
      </div>

      {/* Connection Requests */}
      {connectionRequests.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2>🔔 Collaboration Requests</h2>
            <span className="badge">{connectionRequests.length}</span>
          </div>
          
          <div className="requests-list">
            {connectionRequests.map(request => (
              <div key={request._id} className="request-card">
                <img 
                  src={request.from.profilePicture} 
                  alt={request.from.name}
                  className="request-avatar"
                />
                <div className="request-info">
                  <h3>{request.from.name}</h3>
                  <p className="request-meta">
                    {request.from.college} • {request.from.year}
                  </p>
                  <div className="request-skills">
                    {request.from.skills?.slice(0, 3).map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                  {request.message && (
                    <p className="request-message">"{request.message}"</p>
                  )}
                </div>
                <div className="request-actions">
                  <button 
                    onClick={() => handleAcceptRequest(request._id)}
                    className="btn-accept"
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => handleRejectRequest(request._id)}
                    className="btn-reject"
                  >
                    Reject
                  </button>
                  <Link 
                    to={`/profile/${request.from._id}`}
                    className="btn-view"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Collaborators */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>✨ Recommended Collaborators</h2>
          <Link to="/search" className="see-all">See All →</Link>
        </div>
        
        {recommendations.length === 0 ? (
          <div className="empty-state">
            <p>No recommendations yet. Try adding more skills to your profile!</p>
            <Link to={`/profile/${user?._id}`} className="btn-primary">
              Update Profile
            </Link>
          </div>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map(rec => (
              <Link 
                key={rec._id} 
                to={`/profile/${rec._id}`}
                className="user-card"
              >
                <img 
                  src={rec.profilePicture} 
                  alt={rec.name}
                  className="user-avatar"
                />
                <h3>{rec.name}</h3>
                <p className="user-college">{rec.college}</p>
                <div className="user-skills">
                  {rec.skills?.slice(0, 3).map((skill, idx) => (
                    <span key={idx} className="skill-tag">{skill}</span>
                  ))}
                  {rec.skills?.length > 3 && (
                    <span className="skill-tag more">+{rec.skills.length - 3}</span>
                  )}
                </div>
                <div className="user-stats">
                  <span>📁 {rec.projects?.length || 0}</span>
                  <span>🏆 {rec.achievements?.length || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Manage Your Profile</h2>
        <div className="actions-grid">
          <button 
            onClick={() => nav(`/profile/${user?.id || user?._id}?action=add-project`)}
            className="action-card"
          >
            <span className="action-icon">➕</span>
            <span className="action-text">Add Project</span>
          </button>
          
          <button 
            onClick={() => nav(`/profile/${user?.id || user?._id}?action=add-achievement`)}
            className="action-card"
          >
            <span className="action-icon">🏆</span>
            <span className="action-text">Add Achievement</span>
          </button>
          
          <button 
            onClick={() => nav(`/profile/${user?.id || user?._id}?action=edit`)}
            className="action-card"
          >
            <span className="action-icon">✏️</span>
            <span className="action-text">Edit Profile</span>
          </button>
          
          <button 
            onClick={() => nav('/connections')}
            className="action-card"
          >
            <span className="action-icon">🤝</span>
            <span className="action-text">Manage Connections</span>
          </button>
        </div>
      </div>
    </div>
  );
}