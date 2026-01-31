import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Activity, Phone } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const HospitalLoginPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Email-based login
      if (loginMethod === 'email') {
        if (!formData.email || !formData.password) {
          setError('Please enter both email and password');
          setLoading(false);
          return;
        }

        const userCredential = await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );
        const user = userCredential.user;

        // Find hospital record using adminUid
        const q = query(collection(db, 'hospitals'), where('adminUid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const hospitalDoc = querySnapshot.docs[0];
          const hospitalId = hospitalDoc.id;
          navigate(`/dashboard/${hospitalId}`);
        } else {
          throw new Error("No hospital found associated with this account. Please register your hospital first.");
        }
      } 
      // Phone-based login (simplified - in production, you'd use Firebase Phone Auth)
      else {
        if (!formData.phone || !formData.password) {
          setError('Please enter both phone number and password');
          setLoading(false);
          return;
        }

        // For demo purposes, we'll search by phone and then use email auth
        const q = query(collection(db, 'hospitals'), where('phone', '==', formData.phone));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const hospitalDoc = querySnapshot.docs[0];
          const hospitalData = hospitalDoc.data();
          
          // Now authenticate with the email associated with this phone
          await signInWithEmailAndPassword(auth, hospitalData.email, formData.password);
          navigate(`/dashboard/${hospitalDoc.id}`);
        } else {
          throw new Error("No hospital found with this phone number.");
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific Firebase error codes
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email/phone or password. Please check your credentials.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError(err.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="auth-card"
        >
          <div className="auth-header">
            <Link to="/" className="auth-brand">
              <Activity size={32} />
              <span>WaitLess</span>
            </Link>
            <h1>Hospital Admin Login</h1>
            <p>Access your hospital queue management dashboard</p>
          </div>

          {/* Login Method Toggle */}
          <div className="login-method-toggle">
            <button
              type="button"
              className={`method-btn ${loginMethod === 'email' ? 'active' : ''}`}
              onClick={() => setLoginMethod('email')}
            >
              <Mail size={18} />
              Email
            </button>
            <button
              type="button"
              className={`method-btn ${loginMethod === 'phone' ? 'active' : ''}`}
              onClick={() => setLoginMethod('phone')}
            >
              <Phone size={18} />
              Phone
            </button>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {loginMethod === 'email' ? (
              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@hospital.com"
                  required
                  autoComplete="email"
                />
              </div>
            ) : (
              <div className="form-group">
                <label>
                  <Phone size={18} />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
                  required
                  autoComplete="tel"
                />
              </div>
            )}

            <div className="form-group">
              <label>
                <Lock size={18} />
                Password
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember me for 30 days</span>
              </label>
              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? (
                <div className="loading-spinner">
                  <div className="spinner"></div>
                  Signing in...
                </div>
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Register your hospital
              </Link>
            </p>
            <p>
              <Link to="/patient" className="auth-link">
                Are you a patient? Get a token
              </Link>
            </p>
          </div>

          {/* Security Notice */}
          <div className="security-notice">
            <div className="notice-icon">
              <Lock size={16} />
            </div>
            <div className="notice-text">
              <strong>Secure Login</strong>
              <span>Your connection is encrypted and your data is protected</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HospitalLoginPage;
