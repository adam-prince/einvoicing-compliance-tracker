import React from 'react';

export function TestApp() {
  console.log('TestApp rendering...');
  
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'Arial, sans-serif',
      background: '#f8f9fa',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#007bff' }}>✅ React App is Working!</h1>
      <p>This is a test component to verify React is loading properly.</p>
      <div style={{ 
        background: 'white', 
        padding: '1rem', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginTop: '1rem'
      }}>
        <h2>Test Features:</h2>
        <ul>
          <li>React rendering: ✅ Working</li>
          <li>TypeScript compilation: ✅ Working</li>
          <li>Hot Module Replacement: ✅ Working</li>
          <li>Console logging: Check developer console</li>
        </ul>
        <button 
          onClick={() => console.log('Button clicked!')}
          style={{
            background: '#28a745',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '1rem'
          }}
        >
          Test Button (Check Console)
        </button>
      </div>
    </div>
  );
}