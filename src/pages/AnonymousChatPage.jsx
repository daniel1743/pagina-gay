import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Users, MessageCircle, Heart, ArrowRight, CheckCircle, Home, MessageSquare, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';

const AnonymousChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Sala de Apoyo Anónima - Chactivo | Chat Gay Chile";
    
    // ✅ SEO: Meta description específica
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = '🔒 Sala de Apoyo Anónima - Espacio seguro y confidencial para la comunidad LGBT+ en Chile. Chat de apoyo emocional, consejos y recursos. 100% anónimo y protegido.';
  }, []);

  const handleRegister = () => {
    // Abrir modal de registro rápido si existe
    const event = new CustomEvent('openQuickSignup');
    window.dispatchEvent(event);
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleQuickEscape = () => {
    // Redirect to Google for quick escape
    window.location.href = 'https://www.google.com/search?q=Google.com';
  };

  const benefits = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Espacio 100% Seguro",
      description: "Solo usuarios registrados pueden participar. Tu privacidad está protegida."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Apoyo Emocional",
      description: "Comparte experiencias y recibe apoyo de una comunidad comprensiva."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Totalmente Anónimo",
      description: "Tu identidad está protegida. Habla libremente sin miedo."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Comunidad Activa",
      description: "Conecta con personas que entienden tu experiencia."
    }
  ];

  const features = [
    "Chat en tiempo real 24/7",
    "Moderación activa para tu seguridad",
    "Recursos de apoyo y bienestar",
    "Comunidad empática y respetuosa",
    "Sin censura, con respeto mutuo"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1729] via-[#2C2A4A] to-[#1a1729] text-white">
      {/* Header */}
      <header className="bg-[#22203a]/80 backdrop-blur-sm border-b border-[#413e62] p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h2 className="font-bold text-gray-100 text-lg">Sala de Apoyo Anónima</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Escape Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickEscape}
            className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2"
            aria-label="Escape rápido - Salir inmediatamente"
            title="Escape rápido - Salir inmediatamente"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline text-xs sm:text-sm font-semibold">Salir rápido</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="text-gray-300 hover:text-cyan-400"
          >
            <Home className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 mb-6">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300">Espacio Protegido y Confidencial</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Sala de Apoyo Anónima
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            Un espacio seguro y confidencial donde puedes compartir, recibir apoyo y conectar con una comunidad que te entiende.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={handleRegister}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-lg px-8 py-6 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              <Zap className="w-5 h-5 mr-2" />
              Registrarse Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="border-2 border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 font-bold text-lg px-8 py-6 rounded-xl"
            >
              Ya tengo cuenta
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Registro en menos de 30 segundos</span>
            <span>•</span>
            <span>100% Gratis</span>
            <span>•</span>
            <span>Sin tarjeta de crédito</span>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-effect p-6 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-all hover:shadow-lg hover:shadow-cyan-500/10"
            >
              <div className="text-cyan-400 mb-4">{benefit.icon}</div>
              <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-400">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Main CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass-effect rounded-2xl p-8 md:p-12 border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 mb-16"
        >
          <div className="text-center mb-8">
            <MessageCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              ¿Por qué registrarse?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Esta sala es un espacio protegido donde solo usuarios registrados pueden participar. 
              Esto garantiza un ambiente seguro, respetuoso y libre de spam.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-gray-300">{feature}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button
              onClick={handleRegister}
              size="lg"
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white font-bold text-xl px-12 py-6 rounded-xl shadow-lg hover:scale-105 transition-transform"
            >
              <Shield className="w-6 h-6 mr-3" />
              Acceder a la Sala de Apoyo
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </div>
        </motion.div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="glass-effect rounded-xl p-6 border border-purple-500/20 inline-block">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-gray-300">Moderación Activa</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300">Privacidad Garantizada</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-sm text-gray-300">Comunidad Empática</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alternative: Go to Main Chat */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 mb-4">¿Prefieres chatear en tiempo real?</p>
          <Button
            onClick={() => navigate('/chat/principal')}
            variant="outline"
            className="border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Ir al Chat Principal
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default AnonymousChatPage;
