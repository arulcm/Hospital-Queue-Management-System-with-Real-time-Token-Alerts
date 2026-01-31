import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Mail, Lock, User, Phone, CheckCircle, Loader2, Clock, Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { db, auth } from './firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom'; // Added useNavigate

const RegistrationPage = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    hospitalName: '',
    email: '',
    password: '',
    address: '',
    website: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      // Generate a unique hospitalId (using auth UID for simplicity and consistency)
      const hospitalId = user.uid;

      // Store in Firestore
      await setDoc(doc(db, 'hospitals', hospitalId), {
        hospitalName: formData.hospitalName,
        email: formData.email,
        address: formData.address,
        website: formData.website,
        hospitalId: hospitalId,
        adminUid: user.uid,
        createdAt: serverTimestamp(),
        role: 'admin'
      });

      console.log('Hospital registered with ID:', hospitalId);
      // Redirect logic would go here (e.g., useNavigate from react-router-dom)
      navigate(`/dashboard/${hospitalId}`);

    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Please login instead or use a different email.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password is too weak. Please use at least 6 characters.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Register Hospital</h2>
          <p>Create a professional profile for your healthcare center.</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Hospital Name</label>
            <input
              placeholder="City Medical Center"
              required
              value={formData.hospitalName}
              onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Admin Email</label>
            <input
              type="email"
              placeholder="admin@hospital.com"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Min. 6 characters"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Address (Optional)</label>
            <input
              placeholder="123 Health St, City"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-register w-full mt-4" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
          </button>
        </form>

        <div className="card-footer">
          Already have an account? <a href="/login" className="link">Sign In</a>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
