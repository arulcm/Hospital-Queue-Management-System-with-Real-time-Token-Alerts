import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './LandingPage';
import HospitalRegistrationPage from './HospitalRegistrationPage';
import HospitalLoginPage from './HospitalLoginPage';
import PatientHospitalSelectionPage from './PatientHospitalSelectionPage';
import PatientPage from './PatientPage';
import HospitalDashboard from './HospitalDashboard';
import DoctorDashboard from './DoctorDashboard';
import BackendTestPage from './BackendTestPage';
import FirebaseAPITestPage from './FirebaseAPITestPage';
import Layout from './components/Layout';
import { LayoutProvider } from './components/LayoutContext';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <LayoutProvider>
          <Layout>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/register" element={<HospitalRegistrationPage />} />
                <Route path="/login" element={<HospitalLoginPage />} />
                <Route path="/select-hospital" element={<PatientHospitalSelectionPage />} />
                <Route path="/get-token" element={<PatientPage />} />
                <Route path="/patient" element={<PatientPage />} />
                <Route path="/dashboard/:hospitalId" element={<HospitalDashboard />} />
                <Route path="/doctor/:hospitalId" element={<DoctorDashboard />} />
                <Route path="/test-backend" element={<BackendTestPage />} />
                <Route path="/test-api" element={<FirebaseAPITestPage />} />
              </Routes>
            </ErrorBoundary>
          </Layout>
        </LayoutProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
