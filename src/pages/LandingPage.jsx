import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatDemo from '../components/landing/ChatDemo';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';

// 10 avatares aleatorios para asignar
const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=avatar3',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar4',
  'https://api.dicebear.com/7.x/identicon/svg?seed=avatar5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar6',
  'https://api.dicebear.com/7.x/bottts/svg?seed=avatar7',
  'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar8',
  'https://api.dicebear.com/7.x/identicon/svg?seed=avatar9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar10',
];

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, signInAsGuest } = useAuth();
  const [nickname, setNickname] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Redirigir usuarios autenticados (no guests) directamente al home
  useEffect(() => {
    if (user && !user.isGuest && !user.isAnonymous) {
      navigate('/home', { replace: true });
    }
  }, [user, navigate]);

  // ⚡ ENTRADA DIRECTA - Solo nickname, avatar aleatorio
  const handleQuickJoin = async (e) => {
    e.preventDefault();

    if (!nickname.trim()) {
      toast({
        title: "Ingresa tu nickname",
        description: "Necesitas un nombre para chatear",
        variant: "destructive",
      });
      return;
    }

    if (nickname.trim().length < 3) {
      toast({
        title: "Nickname muy corto",
        description: "Debe tener al menos 3 caracteres",
        variant: "destructive",
      });
      return;
    }

    console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
    console.log('%c🚀 INICIO - Proceso de entrada al chat', 'color: #00ffff; font-weight: bold; font-size: 16px');
    console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
    console.time('⏱️ [LANDING] Desde click hasta navegación');

    setIsLoading(true);

    try {
      // Elegir avatar ALEATORIO de las 10 opciones
      const randomAvatar = AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)];
      console.log(`🎨 Avatar seleccionado: ${randomAvatar.split('seed=')[1]}`);

      // Crear usuario guest en Firebase
      console.time('⏱️ [LANDING] signInAsGuest completo');
      await signInAsGuest(nickname.trim(), randomAvatar);
      console.timeEnd('⏱️ [LANDING] signInAsGuest completo');

      console.timeEnd('⏱️ [LANDING] Desde click hasta navegación');
      console.log('%c✅ NAVEGANDO AL CHAT...', 'color: #00ff00; font-weight: bold; font-size: 14px');

      // 🚀 REDIRIGIR INMEDIATAMENTE - NO ESPERAR
      navigate('/chat/principal', { replace: true });

      // Toast DESPUÉS de navegar (no bloquea)
      setTimeout(() => {
        toast({
          title: "¡Bienvenido! 🎉",
          description: `Hola ${nickname.trim()}`,
        });
        console.timeEnd('⏱️ [TOTAL] Entrada completa al chat');
        console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
        console.log('%c✅ PROCESO COMPLETADO', 'color: #00ff00; font-weight: bold; font-size: 16px');
        console.log('%c═══════════════════════════════════════════', 'color: #00ffff; font-weight: bold');
      }, 100);
    } catch (error) {
      console.timeEnd('⏱️ [LANDING] Desde click hasta navegación');
      console.timeEnd('⏱️ [TOTAL] Entrada completa al chat');
      console.error('%c❌ ERROR EN ENTRADA:', 'color: #ff0000; font-weight: bold; font-size: 14px', error);
      console.log('%c═══════════════════════════════════════════', 'color: #ff0000; font-weight: bold');

      toast({
        title: "Error al entrar",
        description: error.message || "Intenta de nuevo",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-gray-950">
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

          {/* ⚡ INPUT DIRECTO - SOLO NICKNAME */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onSubmit={handleQuickJoin}
            className="max-w-xl mx-auto mb-8"
          >
            <div className="bg-white/10 backdrop-blur-lg border-2 border-purple-500/50 rounded-2xl p-6 shadow-2xl">
              <label className="block text-left text-white font-semibold text-lg mb-3">
                Tu Nickname:
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Ej: Carlos23"
                  maxLength={20}
                  disabled={isLoading}
                  className="flex-1 px-6 py-4 text-lg font-medium rounded-xl border-2 border-purple-400 focus:border-pink-400 focus:ring-4 focus:ring-pink-400/20 outline-none transition-all"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={isLoading || !nickname.trim()}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xl font-bold px-10 py-4 rounded-xl shadow-lg transform hover:scale-105 transition-all duration-200 whitespace-nowrap"
                >
                  {isLoading ? '⏳ Entrando...' : '🚀 Ir al Chat'}
                </button>
              </div>
              <p className="text-purple-200 text-sm mt-4">
                ✨ Avatar asignado automáticamente • Entra en 1 segundo
              </p>
            </div>
          </motion.form>

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
          <ChatDemo onJoinClick={() => document.querySelector('input[type="text"]').focus()} />
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
            onClick={() => document.querySelector('input[type="text"]').focus()}
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
    </div>
  );
}
