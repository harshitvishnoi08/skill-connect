import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import EditProfileModal from '../components/EditProfileModal';
import AddProjectModal from '../components/AddProjectModal';
import AddAchievementModal from '../components/AddAchievementModal';
import SendMessageModal from '../components/SendMessageModal'; // ADD THIS
import './Profile.css';

export default function Profile() {
  const { id } = useParams();
  const location = useLocation();
  const { axios, user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddAchievement, setShowAddAchievement] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false); // ADD THIS
  const [editingProject, setEditingProject] = useState(null);
  const [editingAchievement, setEditingAchievement] = useState(null);
  const [requestSending, setRequestSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);

  const isOwnProfile = user?._id === id || user?.id === id;

  useEffect(() => {
    fetchProfile();
    
    const params = new URLSearchParams(location.search);
    if (params.get('action') === 'add-project') setShowAddProject(true);
    if (params.get('action') === 'add-achievement') setShowAddAchievement(true);
    if (params.get('action') === 'edit') setShowEditProfile(true);
  }, [id, location.search]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/users/${id}`);
      setProfile(res.data);
      
      if (!isOwnProfile) {
        checkConnectionStatus();
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      alert('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const checkConnectionStatus = async () => {
    try {
      const myConnectionsRes = await axios.get('/connections/my-connections');
      const myConnections = myConnectionsRes.data.connections || [];
      const connected = myConnections.some(conn => 
        conn.user._id === id || conn.user.id === id
      );
      
      if (connected) {
        setConnectionStatus('connected');
        setIsConnected(true);
        return;
      }
      
      const sentRequestsRes = await axios.get('/connections/requests/sent');
      const sentRequests = sentRequestsRes.data.requests || [];
      const hasPendingRequest = sentRequests.some(req => 
        (req.to._id === id || req.to.id === id) && req.status === 'pending'
      );
      
      if (hasPendingRequest) {
        setConnectionStatus('pending');
      } else {
        setConnectionStatus(null);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    }
  };

  const sendRequest = async () => {
    try {
      setRequestSending(true);
      await axios.post('/connections/request', { toUserId: id });
      alert('✅ Collaboration request sent!');
      setConnectionStatus('pending');
    } catch (err) {
      alert(err.response?.data?.message || 'Error sending request');
    } finally {
      setRequestSending(false);
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    
    try {
      await axios.delete(`/users/me/projects/${projectId}`);
      alert('Project deleted successfully');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting project');
    }
  };

  const handleDeleteAchievement = async (achievementId) => {
    if (!window.confirm('Are you sure you want to delete this achievement?')) return;
    
    try {
      await axios.delete(`/users/me/achievements/${achievementId}`);
      alert('Achievement deleted successfully');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting achievement');
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <h2>Profile not found</h2>
        <p>The user you're looking for doesn't exist.</p>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-background"></div>
        <div className="header-content">
          <img 
            src={profile.profilePicture} 
            alt={profile.name}
            className="profile-avatar"
          />
          <div className="profile-info">
            <h1>{profile.name}</h1>
            <p className="profile-meta">
              {profile.college} • {profile.year}
            </p>
            {profile.bio && (
              <p className="profile-bio">{profile.bio}</p>
            )}
            
            {/* Social Links */}
            {(profile.socialLinks?.github || profile.socialLinks?.linkedin || profile.socialLinks?.portfolio) && (
              <div className="social-links">
                {profile.socialLinks.github && (
                  <a 
                    href={profile.socialLinks.github.startsWith('http') ? profile.socialLinks.github : `https://${profile.socialLinks.github}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link github"
                  >  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a 
                    href={profile.socialLinks.linkedin.startsWith('http') ? profile.socialLinks.linkedin : `https://${profile.socialLinks.linkedin}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link linkedin"
                  >  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {profile.socialLinks.portfolio && (
                  <a 
                    href={profile.socialLinks.portfolio.startsWith('http') ? profile.socialLinks.portfolio : `https://${profile.socialLinks.portfolio}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="social-link portfolio"
                  >  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    Portfolio
                  </a>
                )}
              </div>
            )}
          </div>
          
          {/* Action Buttons - UPDATED THIS SECTION */}
          <div className="profile-actions">
            {isOwnProfile ? (
              <button onClick={() => setShowEditProfile(true)} className="btn-edit">
                ✏️ Edit Profile
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {connectionStatus === 'connected' ? (
                  <>
                    <span className="connected-badge">✓ Connected</span>
                    <button 
                      onClick={() => setShowMessageModal(true)}
                      className="btn-email"
                    >
                      ✉️ Send Message
                    </button>
                  </>
                ) : connectionStatus === 'pending' ? (
                  <span className="pending-badge">⏳ Request Pending</span>
                ) : (
                  <button 
                    onClick={sendRequest} 
                    disabled={requestSending}
                    className="btn-collab"
                  >
                    {requestSending ? 'Sending...' : '🤝 Send Collab Request'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ... REST OF YOUR PROFILE CODE (Skills, Projects, Achievements, etc.) ... */}
      {/* Keep all your existing sections exactly as they are */}
      
      {/* Skills Section */}
      {profile.skills && profile.skills.length > 0 && (
        <div className="profile-section">
          <h2 className="section-title">💼 Skills</h2>
          <div className="skills-grid">
            {profile.skills.map((skill, idx) => (
              <span key={idx} className="skill-badge">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className="profile-section">
        <div className="section-header">
          <h2 className="section-title">📁 Projects ({profile.projects?.length || 0})</h2>
          {isOwnProfile && (
            <button onClick={() => setShowAddProject(true)} className="btn-add">
              ➕ Add Project
            </button>
          )}
        </div>
        
        {!profile.projects || profile.projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <p>No projects yet</p>
            {isOwnProfile && (
              <button onClick={() => setShowAddProject(true)} className="btn-primary">
                Add Your First Project
              </button>
            )}
          </div>
        ) : (
          <div className="projects-grid">
            {profile.projects.map(project => (
              <div key={project._id} className="project-card">
                <h3>{project.title}</h3>
                <p className="project-description">{project.description}</p>
                
                <div className="project-tech">
                  {project.techStack?.map((tech, idx) => (
                    <span key={idx} className="tech-badge">{tech}</span>
                  ))}
                </div>
                
                <div className="project-links">
                  <a 
                    href={project.githubLink.startsWith('http') ? project.githubLink : `https://${project.githubLink}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="project-link github-link"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    GitHub
                  </a>
                  {project.liveLink && (
                    <a 
                      href={project.liveLink.startsWith('http') ? project.liveLink : `https://${project.liveLink}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="project-link demo-link"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/>
                        <line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                      Live Demo
                    </a>
                  )}
                </div>
                
                {isOwnProfile && (
                  <div className="project-actions">
                    <button 
                      onClick={() => { setEditingProject(project); setShowAddProject(true); }}
                      className="btn-icon"
                      title="Edit"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(project._id)}
                      className="btn-icon delete"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements Section */}
      <div className="profile-section">
        <div className="section-header">
          <h2 className="section-title">🏆 Achievements ({profile.achievements?.length || 0})</h2>
          {isOwnProfile && (
            <button onClick={() => setShowAddAchievement(true)} className="btn-add">
              ➕ Add Achievement
            </button>
          )}
        </div>
        
        {!profile.achievements || profile.achievements.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏆</div>
            <p>No achievements yet</p>
            {isOwnProfile && (
              <button onClick={() => setShowAddAchievement(true)} className="btn-primary">
                Add Your First Achievement
              </button>
            )}
          </div>
        ) : (
          <div className="achievements-timeline">
            {profile.achievements
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map(achievement => (
                <div key={achievement._id} className="achievement-card">
                  <div className="achievement-icon">🏆</div>
                  <div className="achievement-content">
                    <h3>{achievement.title}</h3>
                    <p className="achievement-date">
                      {new Date(achievement.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="achievement-description">{achievement.description}</p>
                    {achievement.certificateLink && (
                      <a 
                        href={achievement.certificateLink.startsWith('http') ? achievement.certificateLink : `https://${achievement.certificateLink}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="certificate-link"
                      >
                        📜 View Certificate
                      </a>
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <div className="achievement-actions">
                      <button 
                        onClick={() => { setEditingAchievement(achievement); setShowAddAchievement(true); }}
                        className="btn-icon"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDeleteAchievement(achievement._id)}
                        className="btn-icon delete"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Connections Section */}
      {profile.connections && profile.connections.length > 0 && (
        <div className="profile-section">
          <h2 className="section-title">🤝 Connections ({profile.connections.length})</h2>
          <div className="connections-grid">
            {profile.connections.slice(0, 12).map(connection => (
              <a 
                key={connection._id} 
                href={`/profile/${connection._id}`}
                className="connection-avatar"
                title={connection.name}
              >
                <img src={connection.profilePicture} alt={connection.name} />
              </a>
            ))}
            {profile.connections.length > 12 && (
              <div className="connection-more">+{profile.connections.length - 12}</div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showEditProfile && (
        <EditProfileModal 
          profile={profile}
          onClose={() => setShowEditProfile(false)}
          onSuccess={() => { fetchProfile(); setShowEditProfile(false); }}
        />
      )}
      
      {showAddProject && (
        <AddProjectModal 
          project={editingProject}
          onClose={() => { setShowAddProject(false); setEditingProject(null); }}
          onSuccess={() => { fetchProfile(); setShowAddProject(false); setEditingProject(null); }}
        />
      )}
      
      {showAddAchievement && (
        <AddAchievementModal 
          achievement={editingAchievement}
          onClose={() => { setShowAddAchievement(false); setEditingAchievement(null); }}
          onSuccess={() => { fetchProfile(); setShowAddAchievement(false); setEditingAchievement(null); }}
        />
      )}
      
      {/* ADD THIS NEW MODAL */}
      {showMessageModal && (
        <SendMessageModal 
          recipient={profile}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  );
}

