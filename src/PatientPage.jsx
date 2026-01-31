import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Phone,
  Hospital as HospitalIcon,
  Ticket,
  ArrowRight,
  ChevronRight,
  Loader2,
  CheckCircle2,
  Sun,
  Moon,
  Stethoscope,
  BriefcaseMedical,
  Bell,
  Clock
} from 'lucide-react';
import { db } from './firebase';
import { useTheme } from './ThemeContext';
import { useLayout } from './components/LayoutContext';
import {
  collection,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  doc
} from 'firebase/firestore';
import { LoadingState } from './components/UIState';

const PatientPage = () => {
  const { theme, toggleTheme } = useTheme();
  const { setHospitalName } = useLayout();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [tokenData, setTokenData] = useState(() => {
    const saved = localStorage.getItem('waitless_token');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedHospital, setSelectedHospital] = useState(() => {
    const saved = localStorage.getItem('selectedHospital'); // Use same key as hospital selection page
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [notifPermission, setNotifPermission] = useState(Notification.permission);

  // Check localStorage on mount
  useEffect(() => {
    console.log('Checking localStorage on mount...');
    const savedHospital = localStorage.getItem('selectedHospital'); // Use same key as hospital selection page
    console.log('Raw localStorage data:', savedHospital);
    
    if (savedHospital) {
      try {
        const hospitalData = JSON.parse(savedHospital);
        console.log('Parsed hospital data:', hospitalData);
        setSelectedHospital(hospitalData);
      } catch (err) {
        console.error('Error parsing hospital data:', err);
      }
    } else {
      console.log('No hospital found in localStorage');
    }
    setIsInitialized(true);
  }, []);

  // Redirect to hospital selection if no hospital is selected (after initialization)
  useEffect(() => {
    console.log('PatientPage - selectedHospital:', selectedHospital);
    console.log('PatientPage - hospitals.length:', hospitals.length);
    console.log('PatientPage - isInitialized:', isInitialized);
    
    // Only redirect if we have initialized and have no hospital selected
    if (isInitialized && !selectedHospital && hospitals.length > 0) {
      console.log('Redirecting to hospital selection...');
      navigate('/select-hospital');
    }
  }, [selectedHospital, hospitals, isInitialized, navigate]);

  useEffect(() => {
    if (selectedHospital) {
      setHospitalName(selectedHospital.name);
    } else {
      setHospitalName('');
    }
  }, [selectedHospital, setHospitalName]);
  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState(() => {
    const saved = localStorage.getItem('waitless_dept');
    return saved ? JSON.parse(saved) : null;
  });
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(() => {
    const saved = localStorage.getItem('waitless_doctor');
    return saved ? JSON.parse(saved) : null;
  });
  const [step, setStep] = useState(() => {
    const savedToken = localStorage.getItem('waitless_token');
    const savedHospital = localStorage.getItem('selectedHospital'); // Use same key
    const savedDepartment = localStorage.getItem('waitless_dept');
    const savedDoctor = localStorage.getItem('waitless_doctor');
    
    // If we have a token, go to token status (step 5)
    if (savedToken) return 5;
    
    // If we have all selections, go to token generation (step 4)
    if (savedHospital && savedDepartment && savedDoctor) return 4;
    
    // If we have hospital and department, go to doctor selection (step 3)
    if (savedHospital && savedDepartment) return 3;
    
    // If we have hospital selected, start with department selection (step 2)
    if (savedHospital) return 2;
    
    return 1;
  });
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [liveQueue, setLiveQueue] = useState({ current: null });
  const [myTokenStatus, setMyTokenStatus] = useState('waiting');

  // Persistence effects
  useEffect(() => {
    if (tokenData) localStorage.setItem('waitless_token', JSON.stringify(tokenData));
    else localStorage.removeItem('waitless_token');
  }, [tokenData]);

  useEffect(() => {
    if (selectedHospital) {
      localStorage.setItem('selectedHospital', JSON.stringify(selectedHospital)); // Use same key
      localStorage.setItem('waitless_hospital', JSON.stringify(selectedHospital)); // Keep old key for compatibility
    } else {
      localStorage.removeItem('selectedHospital');
      localStorage.removeItem('waitless_hospital');
    }
  }, [selectedHospital]);

  useEffect(() => {
    if (selectedDepartment) localStorage.setItem('waitless_dept', JSON.stringify(selectedDepartment));
    else localStorage.removeItem('waitless_dept');
  }, [selectedDepartment]);

  useEffect(() => {
    if (selectedDoctor) localStorage.setItem('waitless_doctor', JSON.stringify(selectedDoctor));
    else localStorage.removeItem('waitless_doctor');
  }, [selectedDoctor]);

  // Handle Auto-Activation on mount
  useEffect(() => {
    const tryAutoUnlock = async () => {
      // If we already have permission, we might be able to play.
      // But we always need a gesture for guaranteed audio.
      // We try to play a silent sound to see if browser allows it.
      const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A');
      try {
        await audio.play();
        setIsActivated(true);
        console.log("Auto-activation successful");
      } catch (e) {
        console.log("Auto-activation blocked, user gesture required");
      }
    };

    if (tokenData) {
      tryAutoUnlock();
    }
  }, [tokenData]);

  // Load departments when hospital is selected
  useEffect(() => {
    if (selectedHospital && isInitialized) {
      console.log('Loading departments for hospital:', selectedHospital.id);
      const fetchDepartments = async () => {
        try {
          const snap = await getDocs(collection(db, `hospitals/${selectedHospital.id}/departments`));
          const departmentsList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          console.log('Loaded departments:', departmentsList);
          setDepartments(departmentsList);
          
          // If no departments, show empty state with option to try again
          if (departmentsList.length === 0) {
            console.log('No departments found for this hospital');
            setDepartments([]);
            setStep(99); // Custom step for no departments
          } else if (step === 1) {
            setStep(2); // Go to department selection
          }
        } catch (err) {
          console.error('Error fetching departments:', err);
        }
      };
      fetchDepartments();
    }
  }, [selectedHospital, isInitialized]);

  // Listen to live queue status when a doctor is selected
  useEffect(() => {
    if (!selectedHospital || !selectedDoctor) return;

    const q = query(
      collection(db, `hospitals/${selectedHospital.id}/tokens`),
      where('doctorId', '==', selectedDoctor.id),
      where('status', '==', 'calling'),
      orderBy('tokenNumber', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setLiveQueue(prev => ({ ...prev, current: snapshot.docs[0].data().tokenNumber }));
      } else {
        setLiveQueue(prev => ({ ...prev, current: 0 }));
      }
    });

    return () => unsubscribe();
  }, [selectedHospital, selectedDoctor]);

  // Listen to MY specific token status
  useEffect(() => {
    if (!tokenData?.id || !selectedHospital?.id) return;

    const unsubscribe = onSnapshot(
      doc(db, `hospitals/${selectedHospital.id}/tokens`, tokenData.id),
      (doc) => {
        if (doc.exists()) {
          const newStatus = doc.data().status;

          // Audio & Push Alert Trigger
          if (newStatus === 'calling' && myTokenStatus !== 'calling') {
            playAlertSound();
            sendPushNotification();
          }

          setMyTokenStatus(newStatus);

          // If completed, maybe clear storage after a delay or show a final screen
          if (newStatus === 'completed') {
            // We'll keep it for a bit so they see it's done
          }
        }
      }
    );

    return () => unsubscribe();
  }, [tokenData, selectedHospital, myTokenStatus]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
  };

  const activateAlerts = async () => {
    // 1. Request Notifications
    await requestNotificationPermission();

    // 2. Unlock Audio Context with a silent sound
    const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFRm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAP8A');
    await audio.play().catch(() => { });

    // 3. Set global activated state
    setIsActivated(true);

    console.log("Alerts unlocked by user gesture");
  };

  const sendPushNotification = () => {
    if (notifPermission === "granted") {
      new Notification("WaitLess: Your Turn! 🚀", {
        body: `Your token #${tokenData.tokenNumber} is being called at ${selectedHospital.hospitalName}.`,
        icon: "/favicon.ico",
        vibrate: [300, 100, 300]
      });
    }
  };

  const playAlertSound = () => {
    try {
      // Use a built-in browser sound or a high-quality notification ping
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
      audio.play().catch(e => console.log("Audio play failed:", e));

      // Vibrate if mobile
      if (window.navigator.vibrate) {
        window.navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      console.error("Audio error:", err);
    }
  };

  const handleNewToken = () => {
    localStorage.removeItem('waitless_token');
    localStorage.removeItem('waitless_hospital');
    localStorage.removeItem('waitless_dept');
    localStorage.removeItem('waitless_doctor');
    setTokenData(null);
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setStep(1);
  };

  const handleHospitalSelect = async (hospital) => {
    setSelectedHospital(hospital);
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, `hospitals/${hospital.id}/departments`));
      setDepartments(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStep(2);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentSelect = async (dept) => {
    setSelectedDepartment(dept);
    setLoading(true);
    try {
      console.log('Fetching doctors for department:', dept.id, dept.name);
      
      // Get all doctors for this hospital
      const allDoctorsSnap = await getDocs(collection(db, `hospitals/${selectedHospital.id}/doctors`));
      const allDoctors = allDoctorsSnap.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data()
      }));
      
      console.log('All doctors found:', allDoctors);
      
      // Filter doctors by department - try multiple matching strategies
      let filteredDoctors = [];
      
      if (allDoctors.length > 0) {
        // Strategy 1: Match by department field
        filteredDoctors = allDoctors.filter(doctor => 
          doctor.department === dept.name || 
          doctor.departmentId === dept.id
        );
        
        // Strategy 2: If no matches, try matching by specialty
        if (filteredDoctors.length === 0) {
          filteredDoctors = allDoctors.filter(doctor => {
            const doctorSpecialty = doctor.specialty?.toLowerCase() || '';
            const deptName = dept.name?.toLowerCase() || '';
            
            // Check if specialty contains department name or vice versa
            return doctorSpecialty.includes(deptName) || deptName.includes(doctorSpecialty);
          });
        }
        
        // Strategy 3: If still no matches, show all doctors as fallback
        if (filteredDoctors.length === 0) {
          console.log('No specific doctors found, showing all available doctors');
          filteredDoctors = allDoctors;
        }
      }
      
      console.log('Filtered doctors:', filteredDoctors);
      setDoctors(filteredDoctors);
      
      if (filteredDoctors.length === 0) {
        console.log('No doctors available for this department');
      }
      
      setStep(3);
    } catch (err) {
      console.error('Error fetching doctors:', err);
      console.error('Error details:', err.code, err.message);
      setDoctors([]);
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doc) => {
    setSelectedDoctor(doc);
    // Store selected doctor and go to patient details step
    localStorage.setItem('waitless_doctor', JSON.stringify(doc));
    console.log('Stored doctor in localStorage');
    setStep(4);
  };

  const generateToken = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const doctorRef = doc(db, `hospitals/${selectedHospital.id}/doctors`, selectedDoctor.id);
      const tokensColRef = collection(db, `hospitals/${selectedHospital.id}/tokens`);

      const newTokenInfo = await runTransaction(db, async (transaction) => {
        const dDoc = await transaction.get(doctorRef);
        if (!dDoc.exists()) throw "Doctor profile not found!";

        const nextToken = (dDoc.data().lastTokenNumber || 0) + 1;

        // Update doctor counter
        transaction.update(doctorRef, { lastTokenNumber: nextToken });

        // Create token
        const tokenRef = doc(tokensColRef);
        transaction.set(tokenRef, {
          tokenNumber: nextToken,
          patientName: formData.name,
          phone: formData.phone,
          doctorId: selectedDoctor.id,
          doctorName: selectedDoctor?.name || 'Unknown Doctor',
          departmentId: selectedDepartment.id,
          departmentName: selectedDepartment.name,
          status: 'waiting',
          createdAt: serverTimestamp()
        });

        return { tokenNumber: nextToken, id: tokenRef.id };
      });

      setTokenData(newTokenInfo);
      setStep(5);
    } catch (err) {
      alert("Error generating token: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAllPatientData = () => {
    localStorage.removeItem('selectedHospital');
    localStorage.removeItem('waitless_dept');
    localStorage.removeItem('waitless_doctor');
    localStorage.removeItem('waitless_token');
    
    setSelectedHospital(null);
    setSelectedDepartment(null);
    setSelectedDoctor(null);
    setTokenData(null);
    setDepartments([]);
    setDoctors([]);
    setStep(1);
    
    console.log('All patient data cleared');
  };

  return (
    <div className="patient-container">
      {/* Patient Header */}
      <header className="patient-header">
        <div className="container-standard">
          <div className="patient-header-content">
            <Link to="/" className="back-link">
              ← Back to Home
            </Link>
            <button className="btn-outline btn-sm" onClick={clearAllPatientData}>
              Start Fresh
            </button>
          </div>
        </div>
      </header>

      <main className="patient-main">
        {loading && <LoadingState message="Processing healthcare request..." />}
        <AnimatePresence mode="wait">
          {/* Step 99: No Departments Available */}
          {!loading && step === 99 && (
            <motion.div
              key="step99"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="step-content"
            >
              <h1>No Departments Available</h1>
              <p>This hospital hasn't set up any departments yet.</p>
              
              <div className="empty-state">
                <BriefcaseMedical size={48} />
                <h3>No Departments Found</h3>
                <p>Please contact the hospital administrator to set up departments.</p>
              </div>
              
              <button className="btn-secondary" onClick={() => navigate('/select-hospital')}>
                Choose Different Hospital
              </button>
            </motion.div>
          )}

          {/* Step 2: Department Selection */}
          {!loading && step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="step-content"
            >
              <button className="btn-back" onClick={() => navigate('/select-hospital')}>← Back</button>
              <h1>Select Department</h1>
              <p>Choosing for {selectedHospital.hospitalName}</p>

              <div className="hospital-list">
                {departments.length === 0 ? (
                  <div className="empty-state">No departments listed.</div>
                ) : (
                  departments.map(d => (
                    <div
                      key={d.id}
                      className="hospital-card"
                      onClick={() => handleDepartmentSelect(d)}
                    >
                      <div className="h-info">
                        <BriefcaseMedical className="h-icon" />
                        <div>
                          <h3>{d.name}</h3>
                        </div>
                      </div>
                      <ChevronRight className="chevron" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Doctor Selection */}
          {!loading && step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="step-content"
            >
              <button className="btn-back" onClick={() => setStep(2)}>← Back</button>
              <h1>Select Doctor</h1>
              <p>Specialists in {selectedDepartment.name}</p>

              <div className="hospital-list">
                {doctors.length === 0 ? (
                  <div className="empty-state">
                    <Stethoscope size={48} />
                    <h3>No Doctors Available</h3>
                    <p>No doctors are currently assigned to this department.</p>
                    <p className="small-text">Please contact the hospital administrator to add doctors to this department.</p>
                    <button className="btn-secondary" onClick={() => setStep(2)}>
                      Choose Different Department
                    </button>
                  </div>
                ) : (
                  doctors.map(d => (
                    <div
                      key={d.id}
                      className="hospital-card"
                      onClick={() => handleDoctorSelect(d)}
                    >
                      <div className="h-info">
                        <Stethoscope className="h-icon" />
                        <div>
                          <h3>{d.name}</h3>
                          <p>{d.specialty}</p>
                          <span className={`doctor-status-badge ${d.isActive ? 'active' : 'inactive'}`}>
                            {d.isActive ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="chevron" />
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* Step 4: Patient Details */}
          {!loading && step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="step-content"
            >
              <button className="btn-back" onClick={() => setStep(3)}>← Back</button>
              <h1>Join the Queue</h1>
              <p>Registering for <strong>{selectedDoctor?.name || 'Selected Doctor'}</strong> ({selectedDepartment.name})</p>

              <form onSubmit={generateToken} className="patient-form">
                <div className="form-group">
                  <label><Users size={18} /> Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label><Phone size={18} /> Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+1 234 567 890"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <>Get Token <Ticket size={18} /></>}
                </button>
              </form>
            </motion.div>
          )}

          {/* Step 5: Token Status */}
          {!loading && step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="token-status-card"
            >
              <div className="success-badge">
                <CheckCircle2 size={32} />
                <h2>Token Generated!</h2>
              </div>

              <div className="token-number-display">
                <span>#{selectedDoctor?.name || 'Doctor'} Token</span>
                <div className="number">#{tokenData.tokenNumber}</div>
              </div>

              <div className="live-status">
                <div className="status-item">
                  <span className="label">Currently Calling</span>
                  <span className="value">#{liveQueue.current === 0 ? '0' : (liveQueue.current || '--')}</span>
                </div>
                <div className="status-item">
                  <span className="label">People Ahead</span>
                  <span className="value">
                    {Math.max(0, tokenData.tokenNumber - (liveQueue.current || 0) - 1)}
                  </span>
                </div>
              </div>

              {!isActivated && notifPermission !== 'granted' && (
                <button className="btn-activate-alerts" onClick={activateAlerts}>
                  <Bell size={18} /> Enable Sounds & Notifications
                  <span className="btn-subtext">Click once to ensure alerts work</span>
                </button>
              )}

              {isActivated && notifPermission === 'default' && (
                <p className="notif-warning">⚠️ Please "Allow" notifications in your browser.</p>
              )}

              {notifPermission === 'denied' && (
                <p className="notif-warning urgent">🚫 Notifications are blocked. Please enable them in site settings.</p>
              )}

              <div className={`alert-box ${myTokenStatus === 'calling' ? 'urgent' : ''}`}>
                {myTokenStatus === 'calling' ? <Bell size={24} className="animate-bounce" /> : <Clock size={20} />}
                <p>
                  {myTokenStatus === 'calling'
                    ? "YOUR TURN! Please move towards the counter immediately."
                    : "We'll notify you when your turn is near. Keep this page open."}
                </p>
              </div>

              {myTokenStatus === 'completed' && (
                <div className="alert-badge success">
                  <CheckCircle2 size={20} /> Appointment Completed
                </div>
              )}

              <div className="token-actions">
                <button className="btn-outline w-full mt-2" onClick={() => setStep(4)}>
                  Get Token
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
};

export default PatientPage;
