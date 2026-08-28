import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check, Crown, ArrowLeft, Sparkles, Shield, Zap } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import ComingSoonModal from '@/components/ui/ComingSoonModal';
import { useCanonical } from '@/hooks/useCanonical';

const PremiumPage = () => {
  // SEO: Canonical tag para página premium
  useCanonical('/premium');

  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = React.useState(false);
  const [comingSoonFeature, setComingSoonFeature] = React.useState({ name: '', description: '' });

  const features = [
    { icon: <Zap className="w-5 h-5" />, text: "Chat ilimitado sin restricciones" },
    { icon: <Shield className="w-5 h-5" />, text: "Verificación avanzada prioritaria" },
    { icon: <Sparkles className="w-5 h-5" />, text: "Acceso a eventos exclusivos" },
    { icon: <Crown className="w-5 h-5" />, text: "Badge Premium visible" },
    { icon: <Check className="w-5 h-5" />, text: "Salas privadas VIP" },
    { icon: <Check className="w-5 h-5" />, text: "Soporte prioritario según disponibilidad" },
  ];

  const handleUpgrade = () => {
    setComingSoonFeature({
      name: 'Premium en preparación',
      description: 'El checkout y las funciones de pago todavía no están habilitados. Esta pantalla es informativa y no realiza ningún cobro.'
    });
    setShowComingSoon(true);
  };


  React.useEffect(() => {
    document.title = "Premium - Chactivo | Chat Gay Chile";
    
    // ✅ SEO: Meta robots noindex - Página requiere autenticación (PrivateRoute)
    // Esto evita que Google Search Console marque error por redirección
    // Google no intentará indexar esta página privada
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');

    return () => {
      // Limpiar al desmontar si el contenido es el que establecimos
      const metaRobots = document.querySelector('meta[name="robots"]');
      if (metaRobots && metaRobots.content === 'noindex, nofollow') {
        metaRobots.remove();
      }
    };
  }, []);

  return (
    <>
      <div className="cv-page cv-shell min-h-screen px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/profile')}
            className="mb-6 text-purple-300 hover:text-purple-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-block gold-gradient p-4 rounded-full mb-4">
              <Crown className="w-12 h-12 text-purple-950" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              Chactivo Premium en preparación
            </h1>
            <p className="text-xl text-muted-foreground">
              La compra todavía no está habilitada
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="cv-card rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold mb-2 text-foreground">Plan Gratuito</h2>
              <p className="text-4xl font-bold mb-6 text-foreground">$0</p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-foreground">
                  <Check className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Acceso a salas públicas
                </li>
                <li className="flex items-center text-foreground">
                  <Check className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Chat básico
                </li>
                <li className="flex items-center text-foreground">
                  <Check className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                  Perfil estándar
                </li>
              </ul>
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="cv-button-secondary w-full"
              >
                {user ? 'Continuar Gratis' : 'Comenzar Gratis'}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="cv-card rounded-3xl p-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 gold-gradient text-purple-950 px-4 py-1 rounded-bl-2xl font-bold text-sm">
                EN PREPARACIÓN
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent">
                Plan Premium
              </h2>
              <p className="text-3xl font-bold mb-2 text-foreground">No disponible</p>
              <p className="text-sm text-muted-foreground mb-6">El precio se definirá cuando exista checkout.</p>
              <ul className="space-y-3 mb-8">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center text-foreground">
                    <span className="gold-gradient p-1 rounded-full mr-2 text-purple-950">
                      {feature.icon}
                    </span>
                    {feature.text}
                  </li>
                ))}
              </ul>
              <div className="space-y-3">
                <Button
                  onClick={handleUpgrade}
                  className="cv-button-primary w-full text-lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Ver estado de Premium
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="cv-card rounded-3xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              ¿Por qué Premium?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Esta página conserva una vista informativa para usuarios autenticados. Las funciones Premium, los eventos y el cobro no están habilitados; no se debe interpretar esta pantalla como una oferta activa. Cuando exista una implementación verificable, se actualizarán aquí las condiciones y el precio.
            </p>
          </motion.div>
        </div>
      </div>

      <ComingSoonModal
        isOpen={showComingSoon}
        onClose={() => setShowComingSoon(false)}
        feature={comingSoonFeature.name}
        description={comingSoonFeature.description}
      />
    </>
  );
};

export default PremiumPage;