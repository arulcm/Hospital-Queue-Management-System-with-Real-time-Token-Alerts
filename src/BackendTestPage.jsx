import React, { useState, useEffect } from 'react';
import { runBackendDiagnostics } from './testBackend';

const BackendTestPage = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runTests = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await runBackendDiagnostics();
      setTestResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 Firebase Backend Diagnostics</h1>
      
      <button 
        onClick={runTests}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          backgroundColor: loading ? '#ccc' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem'
        }}
      >
        {loading ? 'Running Tests...' : 'Run Backend Tests'}
      </button>

      {error && (
        <div style={{
          marginTop: '1rem',
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#991b1b'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResults && (
        <div style={{ marginTop: '2rem' }}>
          <h2>📊 Test Results</h2>
          
          <div style={{
            padding: '1rem',
            backgroundColor: testResults.overall ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${testResults.overall ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '0.5rem',
            marginBottom: '1rem'
          }}>
            <h3 style={{ 
              color: testResults.overall ? '#166534' : '#991b1b',
              margin: '0 0 0.5rem 0'
            }}>
              {testResults.overall ? '✅ Backend Working Properly' : '❌ Backend Issues Found'}
            </h3>
            <p style={{ margin: 0 }}>
              {testResults.overall ? 'All Firebase services are operational' : 'Some Firebase services need attention'}
            </p>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3>Connection Test:</h3>
            <pre style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(testResults.connection, null, 2)}
            </pre>
            
            {testResults.connection.solution && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                backgroundColor: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '0.5rem'
              }}>
                <strong>💡 Solution:</strong> {testResults.connection.solution}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <h3>Security Rules Test:</h3>
            <pre style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(testResults.rules, null, 2)}
            </pre>
          </div>

          <div>
            <h3>🔧 Troubleshooting Guide:</h3>
            <div style={{ lineHeight: '1.8' }}>
              <h4>Common Issues & Solutions:</h4>
              <ul style={{ paddingLeft: '1.5rem' }}>
                <li><strong>Permission Denied:</strong> Update Firestore security rules in Firebase Console</li>
                <li><strong>No Hospitals Found:</strong> Register a hospital first at /register</li>
                <li><strong>No Departments:</strong> New hospitals get basic departments automatically</li>
                <li><strong>No Doctors:</strong> Add doctors via hospital dashboard</li>
                <li><strong>Connection Failed:</strong> Check Firebase configuration in firebase.js</li>
              </ul>
              
              <h4>Quick Fixes:</h4>
              <ol style={{ paddingLeft: '1.5rem' }}>
                <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb' }}>Firebase Console</a></li>
                <li>Navigate to Firestore Database → Rules</li>
                <li>Update rules to allow public read access</li>
                <li>Publish the rules</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackendTestPage;
