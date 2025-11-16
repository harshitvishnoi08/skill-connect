import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import './Connections.css';

export default function Connections() {
  const { axios } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('connections');
  const [connections, setConnections] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Fetch all connections
      const connectionsRes = await axios.get('/connections/my-connections');
      setConnections(connectionsRes.data.connections || []);
      
      // Fetch received requests
      const receivedRes = await axios.get('/connections/requests/received');
      setReceivedRequests(receivedRes.data.requests || []);
      
      // Fetch sent requests
      const sentRes = await axios.get('/connections/requests/sent');
      setSentRequests(sentRes.data.requests || []);
      
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await axios.post(`/connections/accept/${requestId}`);
      alert('✅ Connection accepted!');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error accepting request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await axios.post(`/connections/reject/${requestId}`);
      alert('Request rejected');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error rejecting request');
    }
  };

  const handleCancel = async (requestId) => {
    try {
      await axios.delete(`/connections/cancel/${requestId}`);
      alert('Request cancelled');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error cancelling request');
    }
  };

  const handleRemove = async (connectionId) => {
    if (!window.confirm('Are you sure you want to remove this connection?')) return;
    
    try {
      await axios.delete(`/connections/remove/${connectionId}`);
      alert('Connection removed');
      fetchAllData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error removing connection');
    }
  };

  if (loading) {
    return (
      <div className="connections-loading">
        <div className="spinner"></div>
        <p>Loading connections...</p>
      </div>
    );
  }

  return (
    <div className="connections-container">
      <h1 className="connections-title">🤝 Connections</h1>
      
      {/* Tabs */}
      <div className="connections-tabs">
        <button 
          className={`tab ${activeTab === 'connections' ? 'active' : ''}`}
          onClick={() => setActiveTab('connections')}
        >
          My Connections ({connections.length})
        </button>
        <button 
          className={`tab ${activeTab === 'received' ? 'active' : ''}`}
          onClick={() => setActiveTab('received')}
        >
          Received Requests ({receivedRequests.length})
        </button>
        <button 
          className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
          onClick={() => setActiveTab('sent')}
        >
          Sent Requests ({sentRequests.length})
        </button>
      </div>

      {/* All Connections Tab */}
      {activeTab === 'connections' && (
        <div className="tab-content">
          {connections.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🤝</div>
              <p>No connections yet</p>
              <Link to="/search" className="btn-primary">Find People to Connect</Link>
            </div>
          ) : (
            <div className="connections-grid">
              {connections.map(conn => (
                <div key={conn._id} className="connection-card">
                  <Link to={`/profile/${conn.user._id}`} className="user-link">
                    <img 
                      src={conn.user.profilePicture} 
                      alt={conn.user.name}
                      className="user-avatar"
                    />
                    <h3>{conn.user.name}</h3>
                    <p className="user-college">{conn.user.college}</p>
                    <div className="user-skills">
                      {conn.user.skills?.slice(0, 3).map((skill, idx) => (
                        <span key={idx} className="skill-tag">{skill}</span>
                      ))}
                    </div>
                  </Link>
                  <button 
                    onClick={() => handleRemove(conn._id)}
                    className="btn-remove"
                  >
                    Remove Connection
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Received Requests Tab */}
      {activeTab === 'received' && (
        <div className="tab-content">
          {receivedRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📬</div>
              <p>No pending requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {receivedRequests.map(request => (
                <div key={request._id} className="request-card">
                  <Link to={`/profile/${request.from._id}`} className="request-link">
                    <img 
                      src={request.from.profilePicture} 
                      alt={request.from.name}
                      className="request-avatar"
                    />
                    <div className="request-info">
                      <h3>{request.from.name}</h3>
                      <p>{request.from.college} • {request.from.year}</p>
                      <div className="request-skills">
                        {request.from.skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                      {request.message && (
                        <p className="request-message">"{request.message}"</p>
                      )}
                    </div>
                  </Link>
                  <div className="request-actions">
                    <button 
                      onClick={() => handleAccept(request._id)}
                      className="btn-accept"
                    >
                      ✓ Accept
                    </button>
                    <button 
                      onClick={() => handleReject(request._id)}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sent Requests Tab */}
      {activeTab === 'sent' && (
        <div className="tab-content">
          {sentRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📤</div>
              <p>No sent requests</p>
            </div>
          ) : (
            <div className="requests-list">
              {sentRequests.map(request => (
                <div key={request._id} className="request-card">
                  <Link to={`/profile/${request.to._id}`} className="request-link">
                    <img 
                      src={request.to.profilePicture} 
                      alt={request.to.name}
                      className="request-avatar"
                    />
                    <div className="request-info">
                      <h3>{request.to.name}</h3>
                      <p>{request.to.college} • {request.to.year}</p>
                      <div className="request-skills">
                        {request.to.skills?.slice(0, 3).map((skill, idx) => (
                          <span key={idx} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  </Link>
                  <div className="request-status">
                    <span className={`status-badge ${request.status}`}>
                      {request.status === 'pending' && '⏳ Pending'}
                      {request.status === 'accepted' && '✓ Accepted'}
                      {request.status === 'rejected' && '✕ Rejected'}
                    </span>
                    {request.status === 'pending' && (
                      <button 
                        onClick={() => handleCancel(request._id)}
                        className="btn-cancel"
                      >
                        Cancel Request
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}