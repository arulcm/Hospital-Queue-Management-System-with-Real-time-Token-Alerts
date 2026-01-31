import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Play,
  CheckCircle,
  Clock,
  User,
  ArrowRight,
  Loader2,
  AlertCircle,
  Hash,
  Activity,
  Sun,
  Moon,
  RotateCcw,
  Trash2,
  Stethoscope,
  ChevronLeft
} from 'lucide-react';
import { db } from './firebase';
import { useTheme } from './ThemeContext';
import { useLayout } from './components/LayoutContext';
import { LoadingState } from './components/UIState';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  serverTimestamp,
  limit,
  getDocs,
  writeBatch,
  deleteDoc
} from 'firebase/firestore';

const DoctorDashboard = () => {
  const { theme, toggleTheme } = useTheme();
  const { hospitalId } = useParams();
  const [loading, setLoading] = useState(false);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [waitingQueue, setWaitingQueue] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState(() => {
    return localStorage.getItem(`waitless_doc_id_${hospitalId}`) || null;
  });
  const [doctorInfo, setDoctorInfo] = useState(null);

  const { setHospitalName } = useLayout();

  // Hospital Info and Doctors
  useEffect(() => {
    if (!hospitalId) return;

    const hUnsub = onSnapshot(doc(db, 'hospitals', hospitalId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setHospitalInfo(data);
        setHospitalName(data.hospitalName);
      }
    });

    return () => {
      hUnsub();
      setHospitalName('');
    }
  }, [hospitalId, setHospitalName]);

  useEffect(() => {
    if (!hospitalId) return;

    const fetchDocs = async () => {
      const snap = await getDocs(collection(db, `hospitals/${hospitalId}/doctors`));
      setAvailableDoctors(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchDocs();
  }, [hospitalId]);

  // Handle doctor data and queue listening
  useEffect(() => {
    if (!hospitalId || !selectedDoctorId) return;

    // Doctor Details
    const dUnsub = onSnapshot(doc(db, `hospitals/${hospitalId}/doctors`, selectedDoctorId), (doc) => {
      setDoctorInfo(doc.data());
    });

    // Patients currently being called for THIS doctor
    const callingQ = query(
      collection(db, `hospitals/${hospitalId}/tokens`),
      where('doctorId', '==', selectedDoctorId),
      where('status', '==', 'calling'),
      orderBy('tokenNumber', 'desc'),
      limit(1)
    );

    const callingUnsub = onSnapshot(callingQ, (snapshot) => {
      if (!snapshot.empty) {
        setCurrentPatient({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setCurrentPatient(null);
      }
    });

    // Waiting Queue for THIS doctor
    const waitingQ = query(
      collection(db, `hospitals/${hospitalId}/tokens`),
      where('doctorId', '==', selectedDoctorId),
      where('status', '==', 'waiting'),
      orderBy('tokenNumber', 'asc')
    );

    const waitingUnsub = onSnapshot(waitingQ, (snapshot) => {
      setWaitingQueue(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      dUnsub();
      callingUnsub();
      waitingUnsub();
    };
  }, [hospitalId, selectedDoctorId]);

  const callNext = async () => {
    if (waitingQueue.length === 0) return;
    setLoading(true);

    try {
      const batch = writeBatch(db);

      // 1. If there's a current patient, mark them as completed
      if (currentPatient) {
        const currentRef = doc(db, `hospitals/${hospitalId}/tokens`, currentPatient.id);
        batch.update(currentRef, {
          status: 'completed',
          completedAt: serverTimestamp()
        });
      }

      // 2. Mark the next patient in line as 'calling'
      const nextPatient = waitingQueue[0];
      const nextRef = doc(db, `hospitals/${hospitalId}/tokens`, nextPatient.id);
      batch.update(nextRef, {
        status: 'calling',
        calledAt: serverTimestamp()
      });

      // Atomic commit
      await batch.commit();

    } catch (err) {
      console.error("Error calling next patient:", err);
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async () => {
    if (!currentPatient) return;
    setLoading(true);

    try {
      await updateDoc(doc(db, `hospitals/${hospitalId}/tokens`, currentPatient.id), {
        status: 'completed',
        completedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error marking completed:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetQueue = async () => {
    if (!window.confirm(`Are you sure you want to RESET Dr. ${doctorInfo.name}'s entire queue? This will delete all current tokens for this doctor and reset the counter.`)) {
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // 1. Get all tokens for THIS DOCTOR
      const tokensSnap = await getDocs(query(
        collection(db, `hospitals/${hospitalId}/tokens`),
        where('doctorId', '==', selectedDoctorId)
      ));

      tokensSnap.forEach((tokenDoc) => {
        batch.delete(tokenDoc.ref);
      });

      // 2. Reset the DOCTOR counters
      const doctorRef = doc(db, `hospitals/${hospitalId}/doctors`, selectedDoctorId);
      batch.update(doctorRef, {
        lastTokenNumber: 0
      });

      await batch.commit();
      setCurrentPatient(null);
      setWaitingQueue([]);

      alert("Queue has been reset successfully!");
    } catch (err) {
      console.error("Error resetting queue:", err);
      alert("Failed to reset queue: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const selectDoctor = (id) => {
    setSelectedDoctorId(id);
    localStorage.setItem(`waitless_doc_id_${hospitalId}`, id);
  };

  const switchProfile = () => {
    if (window.confirm("Switch to another doctor profile?")) {
      setSelectedDoctorId(null);
      localStorage.removeItem(`waitless_doc_id_${hospitalId}`);
    }
  };

  return (
    <div className="doctor-dashboard">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Doctor Console</h2>
          {doctorInfo && <p className="subtitle">Dr. {doctorInfo.name} | {doctorInfo.specialty}</p>}
        </div>
        <div className="header-actions">
          {doctorInfo && (
            <button className="btn-outline btn-sm" onClick={switchProfile}>
              Switch Profile
            </button>
          )}
          <button className="btn-reset" onClick={resetQueue} disabled={!selectedDoctorId || loading} title="Reset Queue">
            <RotateCcw size={18} />
            <span>Reset Queue</span>
          </button>
        </div>
      </header>

      <main className="dashboard-grid">
        {!selectedDoctorId ? (
          <div className="profile-selection-overlay">
            <div className="selection-card">
              <h2>Select Your Profile</h2>
              <p>Choose your doctor profile to manage your patients.</p>
              <div className="doctor-grid">
                {availableDoctors.length > 0 ? (
                  availableDoctors.map(doc => (
                    <button key={doc.id} className="doc-select-btn" onClick={() => selectDoctor(doc.id)}>
                      <Stethoscope size={24} />
                      <div>
                        <strong>{doc.name}</strong>
                        <span>{doc.specialty}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="empty-state">No doctor profiles found. Please add them in the Hospital Dashboard.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <section className="current-patient-panel">
              <div className="panel-header">
                <h2>Active Session</h2>
                <div className="status-badge calling">
                  <span className="live-circle"></span> Live
                </div>
              </div>

              <div className="patient-display-card">
                <AnimatePresence mode="wait">
                  {currentPatient ? (
                    <motion.div
                      key={currentPatient.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="patient-info"
                    >
                      <div className="token-circle">
                        {currentPatient.tokenNumber}
                      </div>
                      <h3>{currentPatient.patientName}</h3>
                      <p>In-Session</p>
                      <span className="dept-label">{currentPatient.departmentName}</span>
                    </motion.div>
                  ) : (
                    <div className="empty-state">
                      <User size={48} className="muted-icon" />
                      <p>No active patient. Call next when ready.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>

              <div className="control-actions">
                <button
                  className="btn-secondary"
                  onClick={markCompleted}
                  disabled={!currentPatient || loading}
                >
                  <CheckCircle size={20} /> Mark Completed
                </button>
                <button
                  className="btn-primary"
                  onClick={callNext}
                  disabled={waitingQueue.length === 0 || loading}
                >
                  <ArrowRight size={20} /> Call Next Patient
                </button>
              </div>
            </section>

            <section className="queue-panel">
              <div className="queue-header">
                <h2>Waiting Queue</h2>
                <span className="count-pill">{waitingQueue.length}</span>
              </div>

              {waitingQueue.length > 0 ? (
                <table className="queue-table">
                  <thead>
                    <tr>
                      <th>Token</th>
                      <th>Patient Name</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waitingQueue.map((patient, index) => (
                      <tr key={patient.id}>
                        <td className="token-cell">#{patient.tokenNumber}</td>
                        <td className="name-cell">{patient.patientName}</td>
                        <td>{index === 0 ? 'Next' : 'Waiting'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <Clock size={32} className="muted-icon" />
                  <p>Queue is empty.</p>
                </div>
              )}
            </section>
          </>
        )}
      </main>

    </div>
  );
};

export default DoctorDashboard;
