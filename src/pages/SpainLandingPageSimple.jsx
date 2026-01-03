import React from 'react';

const SpainLandingPageSimple = () => {
  console.log('🔥🔥🔥 SPAIN LANDING SIMPLE: Renderizando...');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: 'white',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🇪🇸 SPAIN LANDING PAGE SIMPLE
      </h1>
      <p style={{ fontSize: '24px' }}>
        Si ves esto, el componente básico funciona
      </p>
      <p style={{ fontSize: '18px', marginTop: '20px', color: '#00ff00' }}>
        ✅ Renderizado exitoso
      </p>
    </div>
  );
};

export default SpainLandingPageSimple;
