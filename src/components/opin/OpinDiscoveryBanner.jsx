/**
 * 🎯 OpinDiscoveryBanner - Banner compacto para invitados descubran OPIN
 * Menos intrusivo: auto-desaparece a los 7 segundos
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OpinDiscoveryBanner = ({ onClose, onOpenOpin }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
    localStorage.setItem('opin_banner_closed', 'true');
  };

  // Auto-desaparecer a los 7 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onClose) onClose();
      localStorage.setItem('opin_banner_closed', 'true');
    }, 7000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (localStorage.getItem('opin_banner_closed') === 'true') {
    return null;
  }

  if (!visible) return null;

  const handleOpenOpin = () => {
    if (onOpenOpin) {
      const handled = onOpenOpin();
      if (handled === true) return;
    }
    navigate('/opin');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="relative rounded-lg border border-purple-500/30 bg-purple-500/10 px-3 py-2 mb-3 flex items-center gap-2"
      >
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs text-foreground/90 leading-tight">
            <span className="font-semibold">OPIN:</span> Mira lo que otros buscan. <button onClick={handleOpenOpin} className="text-purple-400 hover:underline font-medium">Ver</button>
          </p>
        </div>

        <button onClick={handleClose} className="p-1 hover:bg-white/10 rounded transition-colors" aria-label="Cerrar">
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};

export default OpinDiscoveryBanner;
