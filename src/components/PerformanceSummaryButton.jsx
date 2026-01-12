/**
 * 🎯 Performance Summary Button
 * 
 * Componente flotante que muestra un botón para ver el resumen de performance
 * Aparece después de 10 segundos de actividad o se puede activar manualmente
 */

import React, { useState, useEffect } from 'react';
import { showPerformanceSummary } from '@/utils/performanceMonitor';

const PerformanceSummaryButton = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Mostrar botón después de 10 segundos
    const timer = setTimeout(() => {
      setShow(true);
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    showPerformanceSummary();
  };

  if (!show) return null;

  return (
    <button
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999998,
        padding: '12px 20px',
        backgroundColor: '#667eea',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.05)';
        e.target.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
      }}
      title="Ver resumen de velocidad de la aplicación"
    >
      📊 Ver Performance
    </button>
  );
};

export default PerformanceSummaryButton;

