import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * 🛡️ Botón Flotante para Restaurar Identidad Admin
 * Solo visible cuando el admin está usando identidad genérica
 */
const RestoreIdentityButton = () => {
  const { user, restoreAdminIdentity } = useAuth();

  // Solo mostrar si el usuario está usando identidad genérica
  const isUsingGenericIdentity = user?._isUsingGenericIdentity || false;

  if (!isUsingGenericIdentity) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0, y: 100 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0, y: 100 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <motion.button
          onClick={restoreAdminIdentity}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-4 px-6 rounded-full shadow-2xl flex items-center gap-3 border-2 border-white/20"
        >
          <ShieldCheck className="w-6 h-6" />
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-90">Volver a</span>
            <span className="text-sm">Identidad Admin</span>
          </div>
        </motion.button>

        {/* Indicador de identidad actual */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full bg-gray-900/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg shadow-lg border border-purple-500/30 whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-purple-400" />
            <div className="text-xs">
              <p className="opacity-70">Apareces como:</p>
              <p className="font-semibold text-purple-400">{user?.username}</p>
            </div>
          </div>
          {/* Flecha */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full w-0 h-0 border-l-[8px] border-l-gray-900/90 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent"></div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default RestoreIdentityButton;
