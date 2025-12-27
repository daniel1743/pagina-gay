import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatDemo from '../components/landing/ChatDemo';

export default function LandingPage() {
  const navigate = useNavigate();

  const handleJoinClick = () => {
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-20 pb-12">
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-6">
            Chactivo
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-4">
            El chat gay más activo de Chile 🇨🇱
          </p>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Conversaciones reales, gente activa, sin límites. Únete gratis y conoce personas interesantes ahora.
          </p>
        </motion.div>

        {/* Chat Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <ChatDemo onJoinClick={handleJoinClick} />
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

        {/* CTA Final */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <button
            onClick={handleJoinClick}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xl font-bold px-12 py-4 rounded-full shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            🚀 Entrar Gratis Ahora
          </button>
          <p className="text-gray-500 text-sm mt-4">No requiere registro • Totalmente gratis • Anónimo</p>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-800 mt-20 py-8">
        <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 Chactivo • Chat gay Chile • Conversaciones libres y seguras</p>
        </div>
      </div>
    </div>
  );
}
