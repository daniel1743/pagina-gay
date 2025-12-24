import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ArrowLeft, UserPlus, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * COMPONENTE: LoginGate
 *
 * Se muestra SOLO cuando user === null (visitante sin sesión)
 * NO afecta a guests (user.isGuest) ni usuarios registrados
 *
 * Propósito:
 * - Evitar errores de Firestore con user null
 * - Mejorar UX (mensaje claro vs redirect abrupto)
 * - Mejorar SEO (contenido + meta noindex)
 */
const LoginGate = ({ roomSlug }) => {
  const navigate = useNavigate();

  // SEO: Meta robots noindex para esta página
  useEffect(() => {
    // Crear meta robots tag
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = 'noindex, nofollow';
    document.head.appendChild(metaRobots);

    return () => {
      // Limpiar al desmontar
      if (document.head.contains(metaRobots)) {
        document.head.removeChild(metaRobots);
      }
    };
  }, []);

  const handleLogin = () => {
    navigate(`/auth?redirect=/chat/${roomSlug}`);
  };

  const handleSignup = () => {
    navigate(`/auth?redirect=/chat/${roomSlug}`);
  };

  const handleGoHome = () => {
    navigate('/lobby');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-2 border-purple-200 dark:border-purple-800">
          <CardHeader className="text-center space-y-4">
            {/* Icono Lock animado */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex justify-center"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500 blur-xl opacity-50 rounded-full"></div>
                <div className="relative bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-full">
                  <Lock className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>

            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              🔒 Esta sala es privada
            </CardTitle>

            <CardDescription className="text-base">
              Para proteger la privacidad de nuestra comunidad, debes iniciar sesión para acceder a las salas de chat.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Botón principal: Iniciar sesión */}
            <Button
              onClick={handleLogin}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Iniciar sesión
            </Button>

            {/* Botón secundario: Crear cuenta */}
            <Button
              onClick={handleSignup}
              variant="outline"
              className="w-full h-12 text-lg font-semibold border-2 border-purple-300 hover:bg-purple-50 dark:border-purple-700 dark:hover:bg-purple-900"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Crear cuenta gratis
            </Button>

            {/* Separador */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white dark:bg-gray-800 text-gray-500">
                  o
                </span>
              </div>
            </div>

            {/* Enlace: Volver al inicio */}
            <Button
              onClick={handleGoHome}
              variant="ghost"
              className="w-full text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al inicio
            </Button>

            {/* Información adicional */}
            <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                <span className="font-semibold text-purple-600 dark:text-purple-400">
                  🏳️‍🌈 ¿Nuevo en Chactivo?
                </span>
                <br />
                Crea tu cuenta gratis en 30 segundos. Sin datos personales, 100% anónimo.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer opcional con info de la sala */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          <p>
            Intentando acceder a:{' '}
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {roomSlug}
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginGate;
