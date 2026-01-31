import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Hospital, MapPin, Phone, Clock, ArrowRight, Loader2, Activity } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { db } from './firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const PatientHospitalSelectionPage = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [filteredHospitals, setFilteredHospitals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  useEffect(() => {
    // Filter hospitals based on search term
    if (searchTerm.trim() === '') {
      setFilteredHospitals(hospitals);
    } else {
      const filtered = hospitals.filter(hospital =>
        hospital.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredHospitals(filtered);
    }
  }, [searchTerm, hospitals]);

  const fetchHospitals = async () => {
    try {
      const hospitalsQuery = query(
        collection(db, 'hospitals'),
        orderBy('hospitalName', 'asc')
      );
      const querySnapshot = await getDocs(hospitalsQuery);
      const hospitalsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setHospitals(hospitalsList);
      setFilteredHospitals(hospitalsList);
    } catch (err) {
      console.error('Error fetching hospitals:', err);
      setError('Unable to load hospitals. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleHospitalSelect = (hospital) => {
    console.log('Selected hospital:', hospital);
    // Store selected hospital in localStorage for patient flow
    localStorage.setItem('selectedHospital', JSON.stringify(hospital));
    console.log('Stored hospital in localStorage');
    navigate('/patient');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  if (loading) {
    return (
      <div className="patient-selection-page">
        <div className="container-standard">
          <div className="loading-state">
            <Loader2 className="animate-spin" size={32} />
            <p>Loading hospitals...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-selection-page">
      <div className="container-standard">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="selection-header"
        >
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
          <h1>Select Your Hospital</h1>
          <p>Choose where you'd like to get your queue token</p>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="search-section"
        >
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search hospitals by name or location..."
              value={searchTerm}
              onChange={handleSearch}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="clear-search"
              >
                ×
              </button>
            )}
          </div>
        </motion.div>

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="error-state"
          >
            <p>{error}</p>
            <button onClick={fetchHospitals} className="btn-secondary">
              Try Again
            </button>
          </motion.div>
        )}

        {/* Hospitals List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="hospitals-list"
        >
          {filteredHospitals.length === 0 ? (
            <div className="no-results">
              <Hospital size={48} />
              <h3>No hospitals found</h3>
              <p>
                {searchTerm 
                  ? `No hospitals match "${searchTerm}". Try a different search term.`
                  : 'No hospitals are available at the moment.'
                }
              </p>
            </div>
          ) : (
            <div className="hospitals-grid">
              {filteredHospitals.map((hospital, index) => (
                <motion.div
                  key={hospital.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="hospital-card"
                >
                  <div className="hospital-info">
                    <div className="hospital-header">
                      <div className="hospital-icon">
                        <Hospital size={24} />
                      </div>
                      <div className="hospital-details">
                        <h3>{hospital.hospitalName}</h3>
                        <div className="hospital-meta">
                          {hospital.address && (
                            <div className="meta-item">
                              <MapPin size={16} />
                              <span>{hospital.address}</span>
                            </div>
                          )}
                          {hospital.phone && (
                            <div className="meta-item">
                              <Phone size={16} />
                              <span>{hospital.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleHospitalSelect(hospital)}
                    className="select-hospital-btn"
                  >
                    Select Hospital
                    <ArrowRight size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="selection-footer"
        >
          <div className="footer-info">
            <div className="info-item">
              <Clock size={20} />
              <div>
                <strong>Average Wait Time</strong>
                <span>15-30 minutes at most hospitals</span>
              </div>
            </div>
            <div className="info-item">
              <Activity size={20} />
              <div>
                <strong>Real-time Updates</strong>
                <span>Get notified when your turn is near</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PatientHospitalSelectionPage;
