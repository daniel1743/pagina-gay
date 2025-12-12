import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import {
  requestAndSaveLocation,
  checkLocationPermission,
  disableUserLocation,
} from '@/services/geolocationService';

/**
 * Banner para solicitar permisos de ubicación
 * Estilo similar a Grindr
 */
const LocationPermissionBanner = ({ user, onLocationEnabled }) => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [permission, setPermission] = useState('prompt'); // 'granted', 'denied', 'prompt'

  useEffect(() => {
    const checkPermission = async () => {
      const perm = await checkLocationPermission();
      setPermission(perm);

      // Mostrar banner si:
      // 1. El usuario NO tiene ubicación habilitada
      // 2. El permiso no está denegado
      if (!user?.locationEnabled && perm !== 'denied') {
        setShow(true);
      }
    };

    if (user && !user.isGuest) {
      checkPermission();
    }
  }, [user]);

  const handleEnableLocation = async () => {
    setLoading(true);

    try {
      await requestAndSaveLocation(user.id);

      toast({
        title: "Ubicación Habilitada",
        description: "Ahora verás usuarios cercanos a ti",
      });

      setShow(false);
      if (onLocationEnabled) {
        onLocationEnabled();
      }
    } catch (error) {
      console.error('Error habilitando ubicación:', error);

      let errorMessage = error.message;
      if (error.message.includes('denegado')) {
        setPermission('denied');
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    // Guardar en localStorage que el usuario cerró el banner
    localStorage.setItem('location_banner_dismissed', 'true');
  };

  if (!show || !user || user.isGuest) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative mb-6 overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-r from-purple-900/20 to-pink-900/20 backdrop-blur-sm"
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icono */}
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/20">
                <MapPin className="h-6 w-6 text-purple-400" />
              </div>
            </div>

            {/* Contenido */}
            <div className="flex-1">
              <h3 className="mb-2 text-lg font-semibold">
                Encuentra Usuarios Cerca de Ti
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Habilita tu ubicación para ver usuarios cercanos ordenados por distancia.
                Tu ubicación es privada y solo se usa para mostrarte personas cerca.
              </p>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleEnableLocation}
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Obteniendo ubicación...
                    </>
                  ) : (
                    <>
                      <MapPin className="mr-2 h-4 w-4" />
                      Habilitar Ubicación
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Ahora No
                </Button>
              </div>

              {permission === 'denied' && (
                <div className="mt-4 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p>
                    <strong>Permiso denegado.</strong> Ve a la configuración de tu navegador
                    y habilita la ubicación para Chactivo.
                  </p>
                </div>
              )}
            </div>

            {/* Botón cerrar */}
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 rounded-full p-1 hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default LocationPermissionBanner;
