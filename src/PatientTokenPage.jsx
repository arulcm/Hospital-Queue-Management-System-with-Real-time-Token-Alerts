import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Ticket, CheckCircle2, Clock, Bell, AlertCircle, Loader2, Activity } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { db } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, doc, onSnapshot } from 'firebase/firestore';

const PatientTokenPage = () => {
  const { theme } = useTheme();
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [tokenGenerated, setTokenGenerated] = useState(() => {
    // Check if there's a saved token in localStorage
    const savedToken = localStorage.getItem('waitless_token');
    return savedToken ? true : false;
  });
  const [tokenData, setTokenData] = useState(() => {
    // Get saved token data from localStorage
    const savedToken = localStorage.getItem('waitless_token');
    return savedToken ? JSON.parse(savedToken) : null;
  });
  const [currentToken, setCurrentToken] = useState(null);
  const [error, setError] = useState('');
  const [peopleAhead, setPeopleAhead] = useState(0);

  useEffect(() => {
    // Get selected hospital from localStorage
    const savedHospital = localStorage.getItem('selectedHospital');
    if (savedHospital) {
      setSelectedHospital(JSON.parse(savedHospital));
    }
    
    // Get selected department from localStorage
    const savedDepartment = localStorage.getItem('waitless_dept');
    if (savedDepartment) {
      setSelectedDepartment(JSON.parse(savedDepartment));
    }
    
    // Get selected doctor from localStorage
    const savedDoctor = localStorage.getItem('waitless_doctor');
    if (savedDoctor) {
      setSelectedDoctor(JSON.parse(savedDoctor));
    }
  }, []);

  useEffect(() => {
    if (selectedHospital && selectedDoctor) {
      console.log('Setting up token monitoring for doctor:', selectedDoctor.id);
      // Get all tokens for this doctor and calculate current
      const tokensRef = collection(db, `hospitals/${selectedHospital.id}/tokens`);
      const q = query(
        tokensRef, 
        where('doctorId', '==', selectedDoctor.id),
        orderBy('tokenNumber', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('All tokens snapshot received:', snapshot.size, 'docs');
        if (!snapshot.empty) {
          const tokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('All tokens for doctor:', tokens);
          
          // Find the current token being called
          const callingToken = tokens.find(token => token.status === 'calling');
          if (callingToken) {
            console.log('Found calling token:', callingToken.tokenNumber);
            setCurrentToken(callingToken.tokenNumber);
          } else {
            // If no token is being called, use the latest token as current
            const latestToken = tokens[0];
            console.log('No calling token, using latest:', latestToken.tokenNumber);
            setCurrentToken(latestToken.tokenNumber);
          }
        } else {
          console.log('No tokens found for this doctor');
          setCurrentToken(0);
        }
      });

      return () => unsubscribe();
    }
  }, [selectedHospital, selectedDoctor]);

  // Persist token data in localStorage
  useEffect(() => {
    if (tokenData) {
      localStorage.setItem('waitless_token', JSON.stringify(tokenData));
      setTokenGenerated(true);
    } else {
      localStorage.removeItem('waitless_token');
      setTokenGenerated(false);
    }
  }, [tokenData]);

  useEffect(() => {
    if (tokenData && currentToken) {
      // People ahead = current token being called - patient's token
      // If current is 10 and patient is 12, then 2 people ahead
      const peopleAheadCount = Math.max(0, currentToken - tokenData.tokenNumber);
      console.log('People ahead calculation:', {
        currentToken,
        patientToken: tokenData.tokenNumber,
        peopleAhead: peopleAheadCount
      });
      setPeopleAhead(peopleAheadCount);
    }
  }, [tokenData, currentToken]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const generateToken = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!formData.name.trim() || !formData.phone.trim()) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      // Get the last token number for this hospital
      const tokensRef = collection(db, `hospitals/${selectedHospital.id}/tokens`);
      const lastTokenQuery = query(tokensRef, orderBy('tokenNumber', 'desc'), limit(1));
      const lastTokenSnapshot = await getDocs(lastTokenQuery);
      
      let nextTokenNumber = 1;
      if (!lastTokenSnapshot.empty) {
        nextTokenNumber = lastTokenSnapshot.docs[0].data().tokenNumber + 1;
      }

      // Create new token
      const newToken = {
        tokenNumber: nextTokenNumber,
        patientName: formData.name,
        phoneNumber: formData.phone,
        hospitalId: selectedHospital.id,
        hospitalName: selectedHospital.hospitalName,
        departmentId: selectedDepartment?.id || null,
        departmentName: selectedDepartment?.name || null,
        doctorId: selectedDoctor?.id || null,
        doctorName: selectedDoctor?.name || null,
        status: 'waiting',
        createdAt: serverTimestamp(),
        estimatedWaitTime: 15 // minutes
      };

      const docRef = await addDoc(tokensRef, newToken);
      
      setTokenData({
        id: docRef.id,
        ...newToken
      });
      
      setTokenGenerated(true);
      
      // Request notification permission
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }

    } catch (err) {
      console.error('Error generating token:', err);
      setError('Unable to generate token. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
  };

  if (!selectedHospital) {
    return (
      <div className="token-page">
        <div className="container-standard">
          <div className="no-hospital-selected">
            <AlertCircle size={48} />
            <h2>No Hospital Selected</h2>
            <p>Please select a hospital first to generate a token.</p>
            <button 
              onClick={() => window.location.href = '/select-hospital'}
              className="btn-primary"
            >
              Select Hospital
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="token-page">
      <div className="container-standard">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="token-header"
        >
          <div className="hospital-info">
            <h2>{selectedHospital.hospitalName}</h2>
            <p>Get your queue token</p>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {!tokenGenerated ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="token-form-card"
            >
              <div className="form-header">
                <div className="reassurance-icon">
                  <Activity size={32} />
                </div>
                <h3>Your Turn Matters</h3>
                <p>We'll notify you when it's your turn. No need to wait in the crowded area.</p>
              </div>

              <form onSubmit={generateToken} className="token-form">
                {error && (
                  <div className="error-message">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label>
                    <User size={20} />
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Phone size={20} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                    required
                    className="form-input"
                  />
                  <small className="form-hint">We'll send you updates about your token status</small>
                </div>

                <button type="submit" className="btn-primary btn-large w-full" disabled={loading}>
                  {loading ? (
                    <div className="loading-content">
                      <Loader2 className="animate-spin" size={20} />
                      Generating Token...
                    </div>
                  ) : (
                    <div className="btn-content">
                      <Ticket size={20} />
                      Generate My Token
                    </div>
                  )}
                </button>
              </form>

              <div className="reassurance-section">
                <div className="reassurance-item">
                  <CheckCircle2 size={20} />
                  <span>No missed appointments - we'll alert you</span>
                </div>
                <div className="reassurance-item">
                  <Clock size={20} />
                  <span>Typical wait time: 15-30 minutes</span>
                </div>
                <div className="reassurance-item">
                  <Bell size={20} />
                  <span>Real-time notifications on your phone</span>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="token"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
              className="token-display-card"
            >
              <div className="success-header">
                <div className="success-icon">
                  <CheckCircle2 size={48} />
                </div>
                <h2>Token Generated Successfully!</h2>
                <p>Thank you, {tokenData.patientName}. Your token has been created.</p>
              </div>

              <div className="token-number-display">
                <div className="token-label">Your Token Number</div>
                <div className="token-number">#{tokenData.tokenNumber}</div>
                <div className="hospital-name">{tokenData.hospitalName}</div>
                {tokenData.departmentName && (
                  <div className="department-name">Department: {tokenData.departmentName}</div>
                )}
                {tokenData.doctorName && (
                  <div className="doctor-name">Doctor: {tokenData.doctorName}</div>
                )}
              </div>

              <div className="token-status">
                <div className="status-item">
                  <div className="status-label">Current Token</div>
                  <div className="status-value">#{currentToken || '---'}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">People Ahead</div>
                  <div className="status-value">{peopleAhead}</div>
                </div>
                <div className="status-item">
                  <div className="status-label">Estimated Wait</div>
                  <div className="status-value">{formatTime(peopleAhead * 15)}</div>
                </div>
              </div>

              <div className="notification-section">
                <div className="notification-icon">
                  <Bell size={24} />
                </div>
                <div className="notification-text">
                  <strong>Stay Updated</strong>
                  <p>We'll notify you when your turn is approaching. Keep this page open for real-time updates.</p>
                </div>
              </div>

              <div className="token-actions">
                <button 
                  onClick={() => window.print()}
                  className="btn-secondary"
                >
                  Print Token
                </button>
                <button 
                  onClick={() => {
                    setTokenGenerated(false);
                    setTokenData(null);
                    setFormData({ name: '', phone: '' });
                  }}
                  className="btn-outline"
                >
                  Generate New Token
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PatientTokenPage;
