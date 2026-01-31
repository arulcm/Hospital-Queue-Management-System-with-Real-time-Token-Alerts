import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Eye, EyeOff, AlertCircle, Loader2, User } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const UserLoginPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Check if user is already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            // Redirect based on role
            if (userData.role === 'admin') {
              navigate('/dashboard');
            } else if (userData.role === 'doctor') {
              navigate(`/doctor/${userData.hospitalId}`);
            }
          }
        } catch (err) {
          console.error('Error checking user role:', err);
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Get user profile from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        setError('User profile not found. Please register first.');
        await auth.signOut();
        return;
      }

      const userData = userDoc.data();
      
      if (userData.status !== 'active') {
        setError('Your account is not active. Please contact administrator.');
        await auth.signOut();
        return;
      }

      // Redirect based on role
      if (userData.role === 'admin') {
        navigate('/dashboard');
      } else if (userData.role === 'doctor') {
        navigate(`/doctor/${userData.hospitalId}`);
      } else {
        setError('Invalid user role. Please contact administrator.');
        await auth.signOut();
      }

    } catch (err) {
      console.error('Login error:', err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address.');
      } else if (err.code === 'auth/user-disabled') {
        setError('Your account has been disabled. Please contact administrator.');
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="container-standard">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="auth-card"
        >
          <div className="auth-header">
            <div className="auth-icon">
              <LogIn size={32} />
            </div>
            <h1>Welcome Back</h1>
            <p>Sign in to your WaitLess account</p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                <AlertCircle size={20} />
                {error}
              </motion.div>
            )}

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={20} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-with-icon">
                <Lock size={20} />
                <input
                  type={showPassword ? "text" : "password"}
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
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account? <Link to="/register">Create Account</Link>
            </p>
            <p>
              <Link to="/forgot-password" className="forgot-password-link">
                Forgot Password?
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserLoginPage;
