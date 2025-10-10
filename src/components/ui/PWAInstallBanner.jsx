import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Smartphone, Download, Zap, Shield, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

const PWAInstallBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalado como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone
      || document.referrer.includes('android-app://');

    setIsInstalled(isStandalone);

    // Verificar si el usuario ya cerró el banner
    const bannerDismissed = localStorage.getItem('pwa-banner-dismissed');

    if (isStandalone || bannerDismissed) {
      return;
    }

    // Escuchar el evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);

      // Mostrar el banner después de 3 segundos
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detectar cuando se instala la app
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowBanner(false);
      localStorage.setItem('pwa-banner-dismissed', 'true');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback: mostrar instrucciones manuales
      showManualInstructions();
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('Usuario aceptó instalar la PWA');
      setShowBanner(false);
      localStorage.setItem('pwa-banner-dismissed', 'true');
    }

    setDeferredPrompt(null);
  };

  const showManualInstructions = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const message = isIOS
      ? 'En Safari, toca el botón Compartir y luego "Agregar a la pantalla de inicio"'
      : 'En tu navegador, ve al menú (⋮) y selecciona "Instalar app" o "Agregar a pantalla de inicio"';

    alert(`📱 ${message}`);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (isInstalled || !showBanner) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50"
      >
        <div className="relative bg-gradient-to-br from-[#2C2A4A] via-[#3d3a5c] to-[#2C2A4A] rounded-2xl shadow-2xl border-2 border-[#E4007C]/30 overflow-hidden">
          {/* Efecto de brillo animado */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"
               style={{ backgroundSize: '200% 100%' }} />

          {/* Botón cerrar */}
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 z-10 text-gray-400 hover:text-white transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative p-6">
            {/* Header con icono */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[#E4007C] to-[#a3005a] rounded-xl flex items-center justify-center shadow-lg">
                <Smartphone className="w-7 h-7 text-white" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                  Instala Chactivo
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 rounded">
                    Beta
                  </span>
                </h3>
                <p className="text-sm text-gray-300">
                  Acceso rápido desde tu pantalla de inicio
                </p>
              </div>
            </div>

            {/* Beneficios */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="text-center p-2 bg-white/5 rounded-lg backdrop-blur-sm">
                <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-300 font-medium">Súper rápido</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg backdrop-blur-sm">
                <Shield className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-300 font-medium">100% seguro</p>
              </div>
              <div className="text-center p-2 bg-white/5 rounded-lg backdrop-blur-sm">
                <Wifi className="w-5 h-5 text-green-400 mx-auto mb-1" />
                <p className="text-[10px] text-gray-300 font-medium">Funciona offline</p>
              </div>
            </div>

            {/* Info adicional */}
            <div className="bg-white/5 rounded-lg p-3 mb-4 backdrop-blur-sm border border-white/10">
              <p className="text-xs text-gray-300 leading-relaxed">
                ✨ <span className="font-semibold text-white">No necesitas descargar nada</span> de una tienda de apps.
                <br />
                💾 <span className="font-semibold text-white">Ocupa solo ~2MB</span> - nada de espacio desperdiciado.
                <br />
                🔒 <span className="font-semibold text-white">Siempre actualizado</span> automáticamente.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-2">
              <Button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-[#E4007C] to-[#a3005a] hover:from-[#ff0087] hover:to-[#c0006b] text-white font-bold py-3 rounded-xl shadow-lg transition-all hover:scale-105"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar Ahora
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="px-4 text-gray-400 hover:text-white hover:bg-white/10"
              >
                Después
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Animación shimmer para el CSS
const shimmerKeyframes = `
  @keyframes shimmer {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }
`;

// Agregar keyframes al documento
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);
}

export default PWAInstallBanner;
