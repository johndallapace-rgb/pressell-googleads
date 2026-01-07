import React from 'react';

export const revalidate = 0; // Disable cache for this page

export default function CheckPage() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh', 
      fontFamily: 'sans-serif',
      backgroundColor: '#f0fdf4',
      color: '#15803d',
      textAlign: 'center',
      padding: '20px'
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>SISTEMA ONLINE</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'normal' }}>DOMÍNIO VALIDADO</h2>
      <p style={{ marginTop: '2rem', color: '#666' }}>
        Esta página confirma que o roteamento da Vercel está funcionando corretamente.
      </p>
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: 'white', 
        borderRadius: '8px', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontFamily: 'monospace',
        fontSize: '0.9rem'
      }}>
        Timestamp: {new Date().toISOString()}
      </div>
    </div>
  );
}
