/**
 * 🎯 OpinDiscoveryBanner - Banner para que invitados descubran OPIN
 *
 * Se muestra en ChatPage para usuarios invitados
 * Call-to-action: "Descubre perfiles → Regístrate"
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X, Users, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const OpinDiscoveryBanner = ({ onClose }) => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);

  const handleDiscover = () => {
    navigate('/opin');
  };

  const handleClose = () => {
    setVisible(false);
    if (onClose) onClose();
    // Guardar en localStorage que cerró el banner
    localStorage.setItem('opin_banner_closed', 'true');
  };

  // No mostrar si ya cerró antes
  if (localStorage.getItem('opin_banner_closed') === 'true') {
    return null;
  }

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="relative glass-effect border-2 border-purple-500/50 rounded-xl p-4 mb-4 overflow-hidden"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 -z-10" />

        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-base font-bold text-foreground mb-1 flex items-center gap-2">
              🆕 OPIN - Descubre Perfiles
            </h3>
            <p className="text-sm text-foreground/80 mb-3 leading-relaxed">
              Más allá del chat: <strong>Publica lo que buscas</strong> y deja que otros descubran tu perfil.
              Posts activos 24h, conexiones reales.
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Descubre perfiles</span>
              </div>
              <div className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                <span>Posts 24h</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDiscover}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500
                       hover:from-purple-600 hover:to-pink-600 text-white text-sm font-semibold
                       transition-all shadow-md hover:shadow-lg"
            >
              Ver OPIN ahora
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OpinDiscoveryBanner;
