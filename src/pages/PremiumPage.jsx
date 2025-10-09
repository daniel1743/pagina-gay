import React from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Check, Crown, ArrowLeft, Sparkles, Shield, Zap } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const PremiumPage = () => {
  const navigate = useNavigate();
  const { user, upgradeToPremium } = useAuth();

  const features = [
    { icon: <Zap className="w-5 h-5" />, text: "Chat ilimitado sin restricciones" },
    { icon: <Shield className="w-5 h-5" />, text: "Verificación avanzada prioritaria" },
    { icon: <Sparkles className="w-5 h-5" />, text: "Acceso a eventos exclusivos" },
    { icon: <Crown className="w-5 h-5" />, text: "Badge Premium visible" },
    { icon: <Check className="w-5 h-5" />, text: "Salas privadas VIP" },
    { icon: <Check className="w-5 h-5" />, text: "Soporte prioritario 24/7" },
  ];

  const handleUpgrade = () => {
    toast({
      title: "🚧 Pagos en desarrollo",
      description: "La integración de pagos estará disponible pronto. ¡Solicítala en tu próximo mensaje! 🚀",
    });
  };

  const handleUpgradeDemo = () => {
    upgradeToPremium();
    navigate('/profile');
  };

  return (
    <>
      <Helmet>
        <title>Premium - Chactivo</title>
        <meta name="description" content="Actualiza a Premium y disfruta de funciones exclusivas en Chactivo" />
      </Helmet>

      <div className="min-h-screen px-4 py-8">
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
              Chactivo Premium
            </h1>
            <p className="text-xl text-muted-foreground">
              Desbloquea todo el potencial de la comunidad
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="glass-effect rounded-3xl p-8 border-2 border-border"
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
                className="w-full border-border hover:bg-accent"
              >
                {user ? 'Continuar Gratis' : 'Comenzar Gratis'}
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="glass-effect rounded-3xl p-8 border-2 border-yellow-400 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 gold-gradient text-purple-950 px-4 py-1 rounded-bl-2xl font-bold text-sm">
                POPULAR
              </div>
              <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-fuchsia-400 bg-clip-text text-transparent">
                Plan Premium
              </h2>
              <p className="text-4xl font-bold mb-2 text-foreground">$9.990</p>
              <p className="text-sm text-muted-foreground mb-6">por mes</p>
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
                  className="w-full gold-gradient text-purple-950 font-bold text-lg hover:scale-105 transition-transform"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Actualizar Ahora
                </Button>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="glass-effect rounded-3xl p-8 text-center"
          >
            <h3 className="text-2xl font-bold mb-4 text-foreground">
              ¿Por qué Premium?
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Únete a miles de miembros Premium que disfrutan de una experiencia sin límites,
              acceso exclusivo a eventos y la mejor forma de conectar con la comunidad LGBTQ+
              de Santiago. Tu apoyo nos ayuda a mantener Chactivo seguro y en constante mejora.
            </p>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default PremiumPage;