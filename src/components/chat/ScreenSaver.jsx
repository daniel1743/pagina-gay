import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ScreenSaver = ({ onClose }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Actualizar la hora cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('es-CL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-black flex flex-col items-center justify-center"
      onClick={onClose} // Cerrar al hacer clic en cualquier parte
    >
      {/* Hora grande */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="text-center mb-8"
      >
        <div className="text-7xl sm:text-8xl md:text-9xl font-bold text-white mb-4 font-mono tracking-wider">
          {formatTime(currentTime)}
        </div>
        <div className="text-xl sm:text-2xl md:text-3xl text-gray-300 capitalize">
          {formatDate(currentTime)}
        </div>
      </motion.div>

      {/* Botón Volver */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-8 py-6 text-lg sm:text-xl font-semibold rounded-xl backdrop-blur-sm transition-all hover:scale-105"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          VOLVER
        </Button>
      </motion.div>

      {/* Instrucción sutil */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="text-gray-400 text-sm sm:text-base mt-8"
      >
        Toca la pantalla o presiona VOLVER para continuar
      </motion.p>
    </motion.div>
  );
};

export default ScreenSaver;

