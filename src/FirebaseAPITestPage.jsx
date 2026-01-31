import React, { useState } from 'react';
import { runProductionAPITest } from './testFirebaseAPI';

const FirebaseAPITestPage = () => {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const runTest = async () => {
    setLoading(true);
    setError('');
    try {
      const results = await runProductionAPITest();
      setTestResults(results);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔥 Firebase API Test</h1>
      <p>Testing Firebase connection with production environment variables</p>
      
      <button 
        onClick={runTest}
        disabled={loading}
        style={{
          padding: '1rem 2rem',
          backgroundColor: loading ? '#ccc' : '#2563eb',
          color: 'white',
          border: 'none',
          borderRadius: '0.5rem',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '1rem',
          marginBottom: '2rem'
        }}
      >
        {loading ? 'Testing...' : 'Test Firebase API'}
      </button>

      {error && (
        <div style={{
          padding: '1rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          color: '#991b1b',
          marginBottom: '2rem'
        }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {testResults && (
        <div>
          <h2>📊 Test Results</h2>
          
          <div style={{
            padding: '1rem',
            backgroundColor: testResults.overall ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${testResults.overall ? '#bbf7d0' : '#fecaca'}`,
            borderRadius: '0.5rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{ 
              color: testResults.overall ? '#166534' : '#991b1b',
              margin: '0 0 0.5rem 0'
            }}>
              {testResults.overall ? '✅ Firebase API Working' : '❌ Firebase API Issues'}
            </h3>
            <p style={{ margin: 0 }}>
              {testResults.overall ? 'All Firebase services are operational' : 'Some Firebase services need attention'}
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>API Test Results:</h3>
            <pre style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(testResults.api, null, 2)}
            </pre>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3>Auth Test Results:</h3>
            <pre style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '0.5rem',
              overflow: 'auto',
              fontSize: '0.875rem'
            }}>
              {JSON.stringify(testResults.auth, null, 2)}
            </pre>
          </div>

          <div>
            <h3>🔧 Environment Variables Check:</h3>
            <div style={{ 
              backgroundColor: '#f8fafc', 
              padding: '1rem', 
              borderRadius: '0.5rem',
              fontSize: '0.875rem'
            }}>
              <p><strong>API Key:</strong> {import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set' : '❌ Missing'}</p>
              <p><strong>Auth Domain:</strong> {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Missing'}</p>
              <p><strong>Project ID:</strong> {import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing'}</p>
              <p><strong>App URL:</strong> {import.meta.env.VITE_APP_URL || '❌ Missing'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FirebaseAPITestPage;
