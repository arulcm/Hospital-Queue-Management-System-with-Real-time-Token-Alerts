import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Building, LogOut, Settings, Calendar, Shield, Activity, Loader2 } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { auth, db } from './firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const UserProfilePage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [hospitalData, setHospitalData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
          setError('User profile not found');
          return;
        }

        const data = userDoc.data();
        setUserData(data);

        // Get hospital data if available
        if (data.hospitalId) {
          const hospitalDoc = await getDoc(doc(db, 'hospitals', data.hospitalId));
          if (hospitalDoc.exists()) {
            setHospitalData(hospitalDoc.data());
          }
        }

      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to logout');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Not available';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="container-standard">
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="container-standard">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary">
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="container-standard">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="profile-card"
        >
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar">
              <User size={48} />
            </div>
            <div className="profile-info">
              <h1>{userData?.name || 'User'}</h1>
              <p className="profile-role">
                <Shield size={16} />
                {userData?.role === 'admin' ? 'Hospital Administrator' : 'Doctor'}
              </p>
              <p className="profile-status">
                <Activity size={16} />
                Status: <span className="status-active">Active</span>
              </p>
            </div>
            <div className="profile-actions">
              <button onClick={handleLogout} className="btn-outline">
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>

          {/* Profile Details */}
          <div className="profile-sections">
            {/* Personal Information */}
            <div className="profile-section">
              <h2>
                <User size={20} />
                Personal Information
              </h2>
              <div className="info-grid">
                <div className="info-item">
                  <label>Full Name</label>
                  <p>{userData?.name || 'Not available'}</p>
                </div>
                <div className="info-item">
                  <label>Email Address</label>
                  <p>{userData?.email || 'Not available'}</p>
                </div>
                <div className="info-item">
                  <label>Account Created</label>
                  <p>{formatDate(userData?.createdAt)}</p>
                </div>
                <div className="info-item">
                  <label>User Role</label>
                  <p className="role-badge">
                    {userData?.role === 'admin' ? 'Hospital Admin' : 'Doctor'}
                  </p>
                </div>
              </div>
            </div>

            {/* Hospital Information */}
            {hospitalData && (
              <div className="profile-section">
                <h2>
                  <Building size={20} />
                  Hospital Information
                </h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Hospital Name</label>
                    <p>{hospitalData.hospitalName || 'Not available'}</p>
                  </div>
                  <div className="info-item">
                    <label>Hospital Email</label>
                    <p>{hospitalData.email || 'Not available'}</p>
                  </div>
                  <div className="info-item">
                    <label>Address</label>
                    <p>{hospitalData.address || 'Not available'}</p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <p className="status-badge active">
                      {hospitalData.status || 'Active'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="profile-section">
              <h2>
                <Settings size={20} />
                Quick Actions
              </h2>
              <div className="action-grid">
                {userData?.role === 'admin' && (
                  <>
                    <Link to="/dashboard" className="action-card">
                      <Activity size={24} />
                      <h3>Dashboard</h3>
                      <p>Manage hospital operations</p>
                    </Link>
                    <Link to="/settings" className="action-card">
                      <Settings size={24} />
                      <h3>Settings</h3>
                      <p>Configure hospital settings</p>
                    </Link>
                  </>
                )}
                {userData?.role === 'doctor' && (
                  <>
                    <Link to={`/doctor/${userData.hospitalId}`} className="action-card">
                      <Calendar size={24} />
                      <h3>Doctor Dashboard</h3>
                      <p>Manage patient queues</p>
                    </Link>
                    <Link to="/appointments" className="action-card">
                      <Calendar size={24} />
                      <h3>Appointments</h3>
                      <p>View scheduled appointments</p>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Back Navigation */}
          <div className="profile-footer">
            <Link 
              to={userData?.role === 'admin' ? '/dashboard' : `/doctor/${userData.hospitalId}`}
              className="btn-secondary"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProfilePage;
