import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Users, MessageCircle, Heart, ArrowRight, CheckCircle, Home, MessageSquare, Zap, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/components/ui/use-toast';
import { useCanonical } from '@/hooks/useCanonical';

const AnonymousChatPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useCanonical('/anonymous-chat');

  useEffect(() => {
    document.title = "Recursos y conversación LGBT+ | Chactivo";
    
    // ✅ SEO: Meta description específica
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.name = 'description';
      document.head.appendChild(metaDescription);
    }
    metaDescription.content = 'Recursos y conversación para la comunidad LGBT+ en Chile. Revisa las normas, decide qué compartir y entra al chat disponible.';

    let robotsMeta = document.querySelector('meta[name="robots"]');
    if (!robotsMeta) {
      robotsMeta = document.createElement('meta');
      robotsMeta.name = 'robots';
      document.head.appendChild(robotsMeta);
    }
    robotsMeta.content = 'noindex, follow';
  }, []);

  const handleRegister = () => {
    navigate('/auth', { state: { redirectTo: '/chat/principal' } });
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
      title: "Normas claras",
      description: "Revisa las normas y comparte solo la información que consideres necesaria."
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Compartir con cuidado",
      description: "La plataforma no es un servicio de emergencia ni sustituye apoyo profesional."
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: "Controles disponibles",
      description: "Usa un alias cuando la función lo permita y utiliza bloquear o reportar cuando estén disponibles."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Actividad variable",
      description: "No damos por hecho que haya respuestas: la disponibilidad depende de la participación real."
    }
  ];

  const features = [
    "Chat en tiempo real según la actividad",
    "Herramientas de reporte cuando estén disponibles",
    "Normas y límites del servicio visibles",
    "Decide cuánto compartir",
    "No es un servicio de emergencia"
  ];

  return (
    <div className="cv-page cv-shell min-h-screen text-white">
      {/* Header */}
      <header className="cv-header p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6 text-cyan-400" />
          <h2 className="font-bold text-gray-100 text-lg">Recursos y conversación LGBT+</h2>
        </div>
        <div className="flex items-center gap-2">
          {/* Quick Escape Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleQuickEscape}
            className="cv-button-danger px-2 sm:px-3 flex items-center gap-1.5 sm:gap-2"
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
            className="cv-icon-button"
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
          <div className="cv-chip inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-cyan-300">Información y límites claros</span>
          </div>
          
          <h1 className="cv-display text-4xl md:text-6xl font-extrabold mb-6 text-foreground">
            Recursos y conversación LGBT+
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            Una página informativa para revisar límites, normas y opciones de conversación. No prometemos anonimato total ni disponibilidad constante.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={handleRegister}
              size="lg"
              className="cv-button-primary text-lg px-8 py-6 rounded-xl shadow-lg"
            >
              <Zap className="w-5 h-5 mr-2" />
              Registrarse Gratis
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button
              onClick={handleLogin}
              variant="outline"
              size="lg"
              className="cv-button-secondary text-lg px-8 py-6 rounded-xl"
            >
              Ya tengo cuenta
            </Button>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span>Registro gratuito; revisa los requisitos</span>
            <span>•</span>
            <span>Sin pago para el chat público</span>
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
              className="cv-card cv-card-interactive p-6"
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
          className="cv-card p-8 md:p-12 mb-16"
        >
          <div className="text-center mb-8">
            <MessageCircle className="w-16 h-16 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              ¿Por qué registrarse?
            </h2>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto">
              Esta página no inicia una conversación de apoyo independiente. Si quieres conversar, el acceso disponible es el chat principal y sus normas aplican allí.
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
              Entrar al Chat Principal
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
          <div className="cv-card p-6 inline-block">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span className="text-sm text-gray-300">Reportes y controles</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-300">Privacidad con límites claros</span>
              </div>
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-pink-400" />
                <span className="text-sm text-gray-300">Participación responsable</span>
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
