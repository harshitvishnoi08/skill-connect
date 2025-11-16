import React, { useContext, useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthContext } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Search from './pages/Search';
import Connections from './pages/Connections';
import DeleteAccount from './pages/DeleteAccount'; // ADD THIS
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  const location = useLocation();
  const { isAuthenticated, logout, user, axios } = useContext(AuthContext);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Hide navigation on login and register pages
  const authPages = ['/login', '/register'];
  const showNav = !authPages.includes(location.pathname);

  // Fetch pending requests count
  React.useEffect(() => {
    if (isAuthenticated && showNav) {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, showNav]);

  const fetchPendingCount = async () => {
    try {
      const res = await axios.get('/connections/requests/received');
      setPendingRequestsCount(res.data.requests?.length || 0);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
    }
  };

  return (
    <div>
      {showNav && isAuthenticated && (
        <nav style={{ 
          padding: '12px 24px', 
          borderBottom: '2px solid #e2e8f0',
          background: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}>
          <div>
            <Link to="/" style={{ 
              marginRight: 20, 
              textDecoration: 'none', 
              color: '#667eea',
              fontWeight: 600,
              fontSize: 16
            }}>Home</Link>
            <Link to="/search" style={{ 
              marginRight: 20, 
              textDecoration: 'none', 
              color: '#667eea',
              fontWeight: 600,
              fontSize: 16
            }}>Search</Link>
            <Link to="/connections" style={{ 
              marginRight: 20, 
              textDecoration: 'none', 
              color: '#667eea',
              fontWeight: 600,
              fontSize: 16,
              position: 'relative',
              display: 'inline-block'
            }}>
              Connections
              {pendingRequestsCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: -8,
                  right: -12,
                  background: '#fc8181',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {pendingRequestsCount > 9 ? '9+' : pendingRequestsCount}
                </span>
              )}
            </Link>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
            <span style={{ color: '#4a5568', fontSize: 14 }}>
              Welcome, {user?.name || user?.email || 'User'}
            </span>
            
            {/* User Menu Dropdown */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  padding: '8px 16px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                Account ▾
              </button>
              
              {showUserMenu && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: 8,
                  background: 'white',
                  borderRadius: 8,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  minWidth: 200,
                  zIndex: 1000,
                  overflow: 'hidden'
                }}>
                  <Link 
                    to={`/profile/${user?.id || user?._id}`}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      color: '#2d3748',
                      fontSize: 14,
                      fontWeight: 500,
                      borderBottom: '1px solid #e2e8f0'
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    👤 My Profile
                  </Link>
                  
                  <Link 
                    to={`/profile/${user?.id || user?._id}?action=edit`}
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      color: '#2d3748',
                      fontSize: 14,
                      fontWeight: 500,
                      borderBottom: '1px solid #e2e8f0'
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    ✏️ Edit Profile
                  </Link>
                  
                  <Link 
                    to="/delete-account"
                    style={{
                      display: 'block',
                      padding: '12px 16px',
                      textDecoration: 'none',
                      color: '#dc2626',
                      fontSize: 14,
                      fontWeight: 500,
                      borderBottom: '1px solid #e2e8f0'
                    }}
                    onClick={() => setShowUserMenu(false)}
                  >
                    🗑️ Delete Account
                  </Link>
                  
                  <button 
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'transparent',
                      color: '#2d3748',
                      border: 'none',
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontWeight: 500
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
      
      {/* Close dropdown when clicking outside */}
      {showUserMenu && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setShowUserMenu(false)}
        />
      )}
      
      <Routes>
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
        <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/connections" element={<PrivateRoute><Connections /></PrivateRoute>} />
        <Route path="/delete-account" element={<PrivateRoute><DeleteAccount /></PrivateRoute>} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </div>
  );
}