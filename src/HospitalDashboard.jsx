import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  LogOut,
  Settings,
  Bell,
  Plus,
  Trash2,
  Stethoscope,
  Building2,
  Activity,
  User,
  Sun,
  Moon
} from 'lucide-react';
import { db, auth } from './firebase';
import { useLayout } from './components/LayoutContext';
import { useTheme } from './ThemeContext';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { LoadingState, ErrorState } from './components/UIState';

const HospitalDashboard = () => {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [hospitalInfo, setHospitalInfo] = useState(null);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [newDoctor, setNewDoctor] = useState({ name: '', departmentId: '', email: '' });
  const [newDept, setNewDept] = useState('');

  // Fetch Hospital Data, Doctors, and Departments
  const { setHospitalName } = useLayout();

  useEffect(() => {
    const fetchHospitalInfo = async () => {
      const docRef = doc(db, "hospitals", hospitalId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setHospitalInfo(data);
        setHospitalName(data.hospitalName);
      }
    };
    fetchHospitalInfo();

    // Cleanup on unmount
    return () => setHospitalName('');
  }, [hospitalId, setHospitalName]);

  useEffect(() => {
    if (!hospitalId) return;

    const hRef = doc(db, 'hospitals', hospitalId);
    const dRef = collection(db, `hospitals/${hospitalId}/doctors`);
    const deptRef = collection(db, `hospitals/${hospitalId}/departments`);

    // The initial hospital info and name is set by the useEffect above using getDoc.
    // This onSnapshot can be kept for real-time updates to hospitalInfo if needed,
    // but setHospitalName is already handled by the getDoc useEffect.
    const unsubH = onSnapshot(hRef, (snapshot) => {
      if (snapshot.exists()) setHospitalInfo(snapshot.data());
    });

    const unsubD = onSnapshot(query(dRef), (snapshot) => {
      const doctorsList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        isActive: doc.data().isActive !== false // Default to true if not set
      }));
      console.log('All doctors in hospital:', doctorsList);
      setDoctors(doctorsList);
      
      // Migration: Update doctors without isActive field
      doctorsList.forEach(async (doctor) => {
        if (doctor.isActive === undefined) {
          try {
            await updateDoc(doc(db, `hospitals/${hospitalId}/doctors`, doctor.id), {
              isActive: true
            });
            console.log('Migrated doctor:', doctor.id);
          } catch (err) {
            console.error('Error migrating doctor:', err);
          }
        }
      });
    });

    const unsubDept = onSnapshot(query(deptRef), (snapshot) => {
      setDepartments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubH();
      unsubD();
      unsubDept();
    };
  }, [hospitalId]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const addDoctor = async (e) => {
    e.preventDefault();

    const dept = departments.find(d => d.id === newDoctor.departmentId);
    if (!dept) {
      alert("Please select a valid department.");
      return;
    }

    try {
      console.log('Creating doctor:', newDoctor);
      console.log('Selected department:', dept);
      const doctorData = {
        name: newDoctor.name,
        email: newDoctor.email,
        departmentId: newDoctor.departmentId,
        specialty: dept.name, // Mapping department name to specialty for consistency
        isActive: true, // Doctors are active by default when created
        createdAt: serverTimestamp()
      };
      console.log('Doctor data to save:', doctorData);
      
      await addDoc(collection(db, `hospitals/${hospitalId}/doctors`), doctorData);
      console.log('Doctor created successfully');
      setNewDoctor({ name: '', departmentId: '', email: '' });
      setIsAddingDoctor(false);
    } catch (err) {
      console.error('Error adding doctor:', err);
      alert("Error adding doctor: " + err.message);
    }
  };

  const activateAllDoctors = async () => {
    try {
      const doctorsToActivate = doctors.filter(doc => doc.isActive === undefined);
      console.log('Activating doctors:', doctorsToActivate);
      
      for (const doctor of doctorsToActivate) {
        await updateDoc(doc(db, `hospitals/${hospitalId}/doctors`, doctor.id), {
          isActive: true
        });
      }
      
      alert(`Activated ${doctorsToActivate.length} doctors`);
    } catch (err) {
      console.error('Error activating doctors:', err);
      alert('Error activating doctors');
    }
  };

  const assignDoctorToDepartment = async (doctorId, departmentId) => {
    try {
      console.log('Assigning doctor:', doctorId, 'to department:', departmentId);
      await updateDoc(doc(db, `hospitals/${hospitalId}/doctors`, doctorId), {
        departmentId: departmentId
      });
      console.log(`Doctor ${doctorId} assigned to department ${departmentId}`);
      alert(`Doctor assigned to department successfully!`);
    } catch (err) {
      console.error('Error assigning doctor to department:', err);
      console.error('Error details:', err.code, err.message);
      alert(`Error assigning doctor to department: ${err.message}`);
    }
  };

  const batchAssignDepartments = async () => {
    try {
      // Get current departments
      const dentalDept = departments.find(d => d.name === 'Dental');
      const cardiologyDept = departments.find(d => d.name === 'Cardiology');
      
      if (!dentalDept || !cardiologyDept) {
        alert('Please create Dental and Cardiology departments first');
        return;
      }
      
      // Create new doctors with proper assignments
      const newDoctors = [
        {
          name: 'Sugania',
          email: 'sugania@gmail.com',
          departmentId: dentalDept.id,
          specialty: 'Dental',
          isActive: true
        },
        {
          name: 'maha',
          email: 'maha@gmail.com', 
          departmentId: dentalDept.id,
          specialty: 'Dental',
          isActive: true
        },
        {
          name: 'Arul',
          email: 'arulprakasam2302@gmail.com',
          departmentId: cardiologyDept.id,
          specialty: 'Cardiologist',
          isActive: true
        }
      ];
      
      // Delete all existing doctors first
      for (const doctor of doctors) {
        await deleteDoc(doc(db, `hospitals/${hospitalId}/doctors`, doctor.id));
      }
      
      // Create new doctors with proper assignments
      for (const doctorData of newDoctors) {
        await addDoc(collection(db, `hospitals/${hospitalId}/doctors`), {
          ...doctorData,
          createdAt: serverTimestamp()
        });
      }
      
      alert('All doctors have been assigned to departments successfully!');
    } catch (err) {
      console.error('Batch assignment error:', err);
      console.error('Error details:', err.code, err.message);
      alert(`Batch assignment failed: ${err.message}`);
    }
  };

  const toggleDoctorStatus = async (doctorId, currentStatus) => {
    try {
      await updateDoc(doc(db, `hospitals/${hospitalId}/doctors`, doctorId), {
        isActive: !currentStatus
      });
      console.log(`Doctor ${doctorId} status updated to ${!currentStatus}`);
    } catch (err) {
      console.error('Error updating doctor status:', err);
      alert('Error updating doctor status');
    }
  };

  const addDepartment = async (e) => {
    e.preventDefault();
    if (!newDept) return;
    try {
      await addDoc(collection(db, `hospitals/${hospitalId}/departments`), {
        name: newDept,
        createdAt: serverTimestamp()
      });
      setNewDept('');
    } catch (err) {
      alert("Error adding department: " + err.message);
    }
  };

  const deleteItem = async (type, id) => {
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      try {
        await deleteDoc(doc(db, `hospitals/${hospitalId}/${type}s`, id));
      } catch (err) {
        alert("Error deleting: " + err.message);
      }
    }
  };

  if (!hospitalInfo) {
    return <LoadingState message="Connecting to hospital management system..." />;
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <nav className="sidebar-nav">
          <button
            className={activeTab === 'dashboard' ? 'active' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard size={18} /> Overview
          </button>
          <button
            className={activeTab === 'doctors' ? 'active' : ''}
            onClick={() => setActiveTab('doctors')}
          >
            <Users size={18} /> Manage Doctors
          </button>
          <button
            className={activeTab === 'departments' ? 'active' : ''}
            onClick={() => setActiveTab('departments')}
          >
            <Building2 size={18} /> Departments
          </button>
        </nav>
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">

        <section className="dashboard-content">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-text">
                      <h3>Registered Doctors</h3>
                      <div className="stat-number">{doctors.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-text">
                      <h3>Active Departments</h3>
                      <div className="stat-number">{departments.length}</div>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-text">
                      <h3>Queue Status</h3>
                      <div className="stat-number">Online</div>
                    </div>
                  </div>
                </div>

                <div className="quick-info-grid">
                  <div className="info-panel">
                    <h2>Recent Doctors</h2>
                    <div className="list-compact">
                      {doctors.length > 0 ? (
                        <table className="data-table">
                          <thead>
                            <tr>
                              <th>Name</th>
                              <th>Specialty</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {doctors.slice(0, 5).map(doc => (
                              <tr key={doc.id}>
                                <td>Dr. {doc.name}</td>
                                <td>{doc.specialty}</td>
                                <td><span className={`badge ${doc.isActive ? 'badge-success' : 'badge-secondary'}`}>{doc.isActive ? 'Active' : 'Inactive'}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <p className="empty-text">No doctors registered yet.</p>
                      )}
                    </div>
                  </div>
                  <div className="info-panel">
                    <h2>Quick Actions</h2>
                    <div className="actions-stack">
                      <button className="btn-primary" onClick={() => navigate(`/doctor/${hospitalId}`)}>Open Doctor Dashboard</button>
                      <button className="btn-secondary" onClick={() => navigate(`/patient`)}>Switch to Patient View</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'doctors' && (
              <motion.div
                key="doctors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="section-header-inline">
                  <h2>Hospital Doctors</h2>
                  <div className="header-actions">
                    {doctors.some(doc => !doc.departmentId) && (
                      <button className="btn-warning" onClick={batchAssignDepartments}>
                        Fix All Doctor Departments
                      </button>
                    )}
                    {doctors.some(doc => doc.isActive === undefined) && (
                      <button className="btn-secondary" onClick={activateAllDoctors}>
                        Activate All Doctors
                      </button>
                    )}
                    {!isAddingDoctor && (
                      <button className="btn-primary" onClick={() => setIsAddingDoctor(true)}>
                        <Plus size={18} /> Add New Doctor
                      </button>
                    )}
                  </div>
                </div>

                {isAddingDoctor && (
                  <form className="add-form-card" onSubmit={addDoctor}>
                    <div className="form-group">
                      <input
                        placeholder="Doctor's Full Name"
                        required
                        value={newDoctor.name}
                        onChange={e => setNewDoctor({ ...newDoctor, name: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <select
                        required
                        className="form-select"
                        value={newDoctor.departmentId}
                        onChange={e => setNewDoctor({ ...newDoctor, departmentId: e.target.value })}
                      >
                        <option value="">Assign to Department</option>
                        {departments.map(dept => (
                          <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <input
                        placeholder="Contact Email"
                        type="email"
                        required
                        value={newDoctor.email}
                        onChange={e => setNewDoctor({ ...newDoctor, email: e.target.value })}
                      />
                    </div>
                    <div className="form-buttons">
                      <button type="submit" className="btn-primary">Record Doctor</button>
                      <button type="button" className="btn-secondary" onClick={() => setIsAddingDoctor(false)}>Cancel</button>
                    </div>
                  </form>
                )}

                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Doctor Name</th>
                      <th>Specialty</th>
                      <th>Email</th>
                      <th>Department ID</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map(doc => (
                      <tr key={doc.id}>
                        <td className="font-semibold">Dr. {doc.name}</td>
                        <td>{doc.specialty}</td>
                        <td>{doc.email}</td>
                        <td>
                          {doc.departmentId ? (
                            <div className="dept-info">
                              <code>{doc.departmentId}</code>
                            </div>
                          ) : (
                            <span style={{color: 'var(--muted-foreground)', fontSize: '0.875rem'}}>
                              Use "Fix All Doctor Departments" button above
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge ${doc.isActive ? 'active' : 'inactive'}`}>
                            {doc.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="doctor-actions">
                            <button
                              onClick={() => toggleDoctorStatus(doc.id, doc.isActive)}
                              className={`btn-sm status-toggle ${doc.isActive ? 'btn-warning' : 'btn-success'}`}
                            >
                              {doc.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="delete-btn" onClick={() => deleteItem('doctor', doc.id)}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {doctors.length === 0 && <div className="empty-state">No doctors in directory.</div>}
              </motion.div>
            )}

            {activeTab === 'departments' && (
              <motion.div
                key="departments"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="section-header-inline">
                  <h2>Hospital Departments</h2>
                </div>

                <form className="inline-add-form" onSubmit={addDepartment}>
                  <input
                    placeholder="Department Name (e.g. Cardiology, Orthopedics)"
                    required
                    value={newDept}
                    onChange={e => setNewDept(e.target.value)}
                  />
                  <button type="submit" className="btn-primary">Add Department</button>
                </form>

                <div className="departments-grid">
                  {departments.map(dept => (
                    <div key={dept.id} className="dept-card">
                      <div className="dept-icon"><Building2 size={24} /></div>
                      <h3>{dept.name}</h3>
                      <button className="delete-btn" onClick={() => deleteItem('department', dept.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {departments.length === 0 && <div className="empty-state">No departments recorded.</div>}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

    </div>
  );
};

export default HospitalDashboard;
