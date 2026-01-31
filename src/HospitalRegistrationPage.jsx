import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Mail, Phone, Lock, User, MapPin, CheckCircle, AlertCircle, Loader2, Activity } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { auth, db } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';

const HospitalRegistrationPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    hospitalName: '',
    adminName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const generateHospitalId = (uid) => {
    // Create a readable hospital ID from the auth UID
    return `hospital_${uid.slice(0, 8)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Generate unique hospital ID
      const hospitalId = generateHospitalId(user.uid);

      // Create hospital record in Firestore
      const hospitalData = {
        hospitalId: hospitalId,
        hospitalName: formData.hospitalName,
        adminName: formData.adminName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        adminUid: user.uid,
        createdAt: serverTimestamp(),
        isActive: true,
        settings: {
          allowOnlineTokens: true,
          tokenPrefix: 'WL',
          averageConsultationTime: 15
        }
      };

      await setDoc(doc(db, 'hospitals', hospitalId), hospitalData);

      // Create basic departments for the hospital
      const basicDepartments = [
        { name: 'General Medicine', description: 'General health consultations' },
        { name: 'Emergency', description: 'Emergency medical services' }
      ];

      // Add basic departments to Firestore
      for (const dept of basicDepartments) {
        await addDoc(collection(db, `hospitals/${hospitalId}/departments`), {
          ...dept,
          isActive: true,
          createdAt: serverTimestamp()
        });
      }

      setSuccess(true);
      
      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate(`/dashboard/${hospitalId}`);
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="auth-card success-card"
          >
            <div className="success-content">
              <div className="success-icon">
                <CheckCircle size={64} />
              </div>
              <h1>Hospital Registered Successfully!</h1>
              <p>Welcome to WaitLess. Your hospital is now ready to manage queues efficiently.</p>
              <p>Redirecting to your dashboard...</p>
              <div className="loading-spinner">
                <Loader2 className="animate-spin" size={24} />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="auth-card registration-card"
        >
          <div className="auth-header">
            <Link to="/" className="auth-brand">
              <Activity size={32} />
              <span>WaitLess</span>
            </Link>
            <h1>Register Your Hospital</h1>
            <p>Join thousands of healthcare providers managing queues efficiently</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {/* Hospital Information */}
            <div className="form-section">
              <h3>Hospital Information</h3>
              
              <div className="form-group">
                <label>
                  <Building size={18} />
                  Hospital Name *
                </label>
                <input
                  type="text"
                  name="hospitalName"
                  value={formData.hospitalName}
                  onChange={handleChange}
                  placeholder="City General Hospital"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  <MapPin size={18} />
                  Hospital Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Medical Street, City, State 12345"
                  required
                />
              </div>
            </div>

            {/* Administrator Information */}
            <div className="form-section">
              <h3>Administrator Information</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <User size={18} />
                    Admin Name *
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    value={formData.adminName}
                    onChange={handleChange}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={18} />
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hospital.com"
                  required
                />
              </div>
            </div>

            {/* Security */}
            <div className="form-section">
              <h3>Security</h3>
              
              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Lock size={18} />
                    Password *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Lock size={18} />
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter password"
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <div className="loading-spinner">
                  <Loader2 className="animate-spin" size={20} />
                  Creating Hospital Account...
                </div>
              ) : (
                <>
                  <Building size={18} />
                  Register Hospital
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
            <p>
              <Link to="/patient" className="auth-link">
                Are you a patient? Get a token
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HospitalRegistrationPage;
