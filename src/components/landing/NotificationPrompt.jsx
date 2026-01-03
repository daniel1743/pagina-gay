import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from 'lucide-react';

const NotificationPrompt = ({ minUsers = 10, currentUsers = 0, countryName = "tu zona" }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-50 max-w-[300px]"
        >
          <div className="bg-gray-900/90 backdrop-blur-md border border-purple-500/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
            <div className="bg-purple-500/20 p-2 rounded-full">
              <Bell className="w-6 h-6 text-purple-400 animate-bounce" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">¡Hay actividad!</p>
              <p className="text-xs text-gray-300">
                Personas de <span className="text-purple-300 font-semibold">{countryName}</span> están chateando ahora mismo.
              </p>
            </div>
            <button 
              onClick={() => setShow(false)} 
              className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-gray-600"
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default NotificationPrompt;
