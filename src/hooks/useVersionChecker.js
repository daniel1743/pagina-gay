import { useEffect, useRef } from 'react';
import { initVersionChecker } from '@/utils/versionChecker';

/**
 * Hook para verificar actualizaciones de la aplicación
 * 
 * @param {Object} options - Opciones de configuración
 * @param {number} options.checkInterval - Intervalo en ms para verificar (default: 60000 = 1 minuto)
 * @param {Function} options.onUpdateAvailable - Callback cuando se detecta actualización
 * @param {boolean} options.autoReload - Si debe recargar automáticamente (default: true)
 */
export const useVersionChecker = (options = {}) => {
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (import.meta.env.DEV) {
      return undefined;
    }

    // Inicializar el checker de versiones
    cleanupRef.current = initVersionChecker(options);

    // Cleanup al desmontar
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [options.checkInterval, options.autoReload]); // Re-ejecutar si cambian estas opciones

  return cleanupRef.current;
};









