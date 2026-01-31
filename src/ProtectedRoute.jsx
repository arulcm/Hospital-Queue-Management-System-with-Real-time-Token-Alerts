import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { auth } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

const ProtectedRoute = ({ children, requiredRole, hospitalId }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (authUser) => {
      if (!authUser) {
        // No user is signed in
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        // Get user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', authUser.uid));
        
        if (!userDoc.exists()) {
          setError('User profile not found');
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        
        // Check if user is active
        if (data.status !== 'active') {
          setError('Your account is not active');
          setLoading(false);
          return;
        }

        // Check role requirements
        if (requiredRole && data.role !== requiredRole) {
          setError(`Access denied. ${requiredRole} role required.`);
          setLoading(false);
          return;
        }

        // Check hospital access for doctors
        if (requiredRole === 'doctor' && hospitalId && data.hospitalId !== hospitalId) {
          setError('Access denied. You do not have access to this hospital.');
          setLoading(false);
          return;
        }

        setUser(authUser);
        setUserData(data);

      } catch (err) {
        console.error('Error checking user authentication:', err);
        setError('Authentication check failed');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [requiredRole, hospitalId]);

  if (loading) {
    return (
      <div className="protected-route-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="protected-route-error">
        <div className="error-container">
          <h2>Access Denied</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page
    return <Navigate to="/login" replace />;
  }

  // User is authenticated and authorized
  return children;
};

export default ProtectedRoute;
