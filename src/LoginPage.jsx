import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, Clock, AlertCircle, Sun, Moon, Activity } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

const LoginPage = () => {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({ email: '', password: '' });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;

            // First, try to find the hospital document using the UID as the ID (as set in RegistrationPage)
            const hospitalDocRef = doc(db, 'hospitals', user.uid);
            const hospitalDoc = await getDoc(hospitalDocRef);

            if (hospitalDoc.exists()) {
                navigate(`/dashboard/${user.uid}`);
            } else {
                // Secondary check: Find by adminUid field (if the ID scheme changed)
                const q = query(collection(db, 'hospitals'), where('adminUid', '==', user.uid));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const hospitalId = querySnapshot.docs[0].id;
                    navigate(`/dashboard/${hospitalId}`);
                } else {
                    throw new Error("Login successful, but no hospital profile was found. Please register your hospital first.");
                }
            }
        } catch (err) {
            console.error("Login error:", err);
            // Handle specific Firebase error codes for better UX
            if (err.code === 'auth/invalid-credential') {
                setError("Invalid email or password. If you haven't registered, please create an account first.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="card-header">
                    <h1>Hospital Login</h1>
                    <p>Enter your credentials to access your dashboard.</p>
                </div>

                {
                    error && (
                        <div className="error-alert">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )
                }

                <form className="login-form" onSubmit={handleLogin}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="admin@hospital.com"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading && <Loader2 className="animate-spin" size={18} />}
                        {loading ? 'Logging in...' : 'Sign In'}
                    </button>
                </form>

                <div className="footer-text">
                    Don't have an account? <a href="/register">Register Hospital</a>
                </div>
            </div >

        </div >
    );
};

export default LoginPage;
