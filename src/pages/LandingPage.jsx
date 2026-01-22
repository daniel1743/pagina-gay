import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatDemo from '../components/landing/ChatDemo';
import { useAuth } from '@/contexts/AuthContext';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';
import TelegramBanner from '@/components/ui/TelegramBanner';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showGuestModal, setShowGuestModal] = useState(false);

  // ✅ Redirigir usuarios autenticados (no guests) directamente al home
  useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/home', { replace: true });
    } else if (user && (user.isGuest || user.isAnonymous)) {
      // Usuario ya invitado - ir directo al chat principal
      navigate('/chat/principal', { replace: true });
    }
  }, [user, navigate]);

  // ✅ FASE 1: Abrir modal único para invitados
  const handleQuickJoin = () => {
    if (user && (user.isGuest || user.isAnonymous)) {
      navigate('/chat/principal', { replace: true });
    } else {
      setShowGuestModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      {/* 📢 Banner Telegram - Fijo en la parte superior */}
      <TelegramBanner className="sticky top-0 z-50" />

      {/* Hero Section - CTA GRANDE */}
      <div className="container mx-auto px-4 pt-12 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <h1 className="text-6xl md:text-8xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-8 leading-tight">
            Chactivo
          </h1>

          {/* 🔥 CTA PRINCIPAL - MENSAJE PODEROSO */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="max-w-2xl mx-auto mb-10"
          >
            <p className="text-3xl md:text-4xl font-bold text-white mb-3">
              Chatea YA con Gente Real
            </p>
            <p className="text-xl text-purple-300">
              Sin registro • Sin esperas • 100% Gratis
            </p>
          </motion.div>

          {/* ✅ FASE 1: Botón para abrir modal único (formulario inline desactivado) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="bg-white/10 backdrop-blur-lg border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl text-center">
              <p className="text-white font-semibold text-lg mb-4">
                Chatea con Gente Real
              </p>
              <button
                onClick={handleQuickJoin}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold px-10 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 whitespace-nowrap w-full sm:w-auto"
              >
                🚀 Entrar al Chat
              </button>
              <p className="text-purple-200 text-sm mt-4">
                ✨ Sin registro • Avatar automático • Entra en segundos
              </p>
            </div>
          </motion.div>

          {/* Indicadores de actividad */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="flex justify-center gap-8 text-gray-300 mb-12"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm">+{Math.floor(Math.random() * 50) + 30} usuarios online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <span className="text-sm">Conversaciones activas ahora</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Chat Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <ChatDemo onJoinClick={handleQuickJoin} />
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid md:grid-cols-3 gap-6 mt-16"
        >
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">🔥</div>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Conversaciones Calientes</h3>
            <p className="text-gray-400">Gente atrevida y directa sin rodeos ni mojigaterías</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-bold text-purple-400 mb-2">100% Activo</h3>
            <p className="text-gray-400">Usuarios reales conectados 24/7 listos para chatear</p>
          </div>
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center">
            <div className="text-4xl mb-3">😈</div>
            <h3 className="text-xl font-bold text-purple-400 mb-2">Sin Límites</h3>
            <p className="text-gray-400">Expresa tu personalidad sin censura ni restricciones</p>
          </div>
        </motion.div>

        {/* CTA Secundario */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="text-center mt-16"
        >
          <button
            onClick={handleQuickJoin}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold px-12 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            💬 Empieza a Chatear
          </button>
          <p className="text-gray-500 text-sm mt-4">Totalmente anónimo • Sin descargas • Desde tu navegador</p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 Chactivo • Chat gay Chile • Conversaciones libres y seguras</p>
        </div>
      </div>

      {/* ✅ FASE 1: GuestUsernameModal - ÚNICO punto de entrada para invitados */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="principal"
      />
    </div>
  );
}
