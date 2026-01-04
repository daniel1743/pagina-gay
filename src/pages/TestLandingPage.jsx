import React from 'react';

const TestLandingPage = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#4CAF50',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        ✅ PÁGINA DE PRUEBA
      </h1>

      <p style={{ fontSize: '24px', marginBottom: '30px' }}>
        Si ves esto, React está funcionando correctamente
      </p>

      <a
        href="/chat/principal"
        style={{
          padding: '20px 40px',
          fontSize: '20px',
          backgroundColor: 'white',
          color: '#4CAF50',
          textDecoration: 'none',
          borderRadius: '10px',
          fontWeight: 'bold',
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}
      >
        IR AL CHAT
      </a>

      <p style={{ fontSize: '14px', marginTop: '30px', opacity: 0.8 }}>
        Ruta: {window.location.pathname}
      </p>
    </div>
  );
};

export default TestLandingPage;
