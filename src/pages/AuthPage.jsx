
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Eye, EyeOff, Zap, MessageSquare } from 'lucide-react';
import { useCanonical } from '@/hooks/useCanonical';
import { GuestUsernameModal } from '@/components/auth/GuestUsernameModal';

const AuthPage = () => {
  // SEO: Canonical tag para página de autenticación
  useCanonical('/auth');

  React.useEffect(() => {
    const previousTitle = document.title;
    // Título optimizado para atraer clics desde Google
    document.title = "Entra al Chat Gay (Sin Registro) o Inicia Sesión | Chactivo";

    // 🚨 HE BORRADO EL CÓDIGO DE NOINDEX 🚨
    // Ahora Google podrá indexar esta página y mandar tráfico al botón de Invitado.

    return () => {
      document.title = previousTitle;
    };
  }, []);

  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    phone: ''
  });
  const [ageError, setAgeError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showGuestModal, setShowGuestModal] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(loginData.email, loginData.password)) {
      navigate('/home'); // ✅ Redirigir a /home después del login
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setAgeError('');

    // ✅ VALIDACIÓN CRÍTICA: Verificar edad mínima (18 años)
    const age = parseInt(registerData.age);
    if (isNaN(age) || age < 18) {
      setAgeError('Debes ser mayor de 18 años para registrarte. Esta es una comunidad para adultos.');
      return;
    }
    if (age > 120) {
      setAgeError('Por favor ingresa una edad válida.');
      return;
    }

    if (register(registerData)) {
      navigate('/home'); // ✅ Redirigir a /home después del registro
    }
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/landing')}
            className="mb-6 text-purple-300 hover:text-purple-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          {/* 🚀 HERO PRINCIPAL: ACCESO INVITADO - Prioridad #1 */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="glass-effect rounded-3xl p-8 sm:p-10 mb-6 border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-900/30 via-purple-900/30 to-fuchsia-900/30 relative overflow-hidden"
          >
            {/* Efecto de brillo animado de fondo */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-fuchsia-500/10 animate-pulse"></div>
            
            <div className="relative z-10 text-center">
              {/* Icono animado */}
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="inline-block mb-6"
              >
                <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-cyan-400 to-fuchsia-400 flex items-center justify-center shadow-2xl shadow-cyan-500/50">
                  <MessageSquare className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              
              {/* H2 Principal */}
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                ¿Solo quieres mirar? No necesitas cuenta.
              </h2>
              
              {/* Descripción */}
              <p className="text-base sm:text-lg text-gray-300 mb-8 max-w-xl mx-auto leading-relaxed">
                Entra y chatea ahora mismo. Sin email, sin contraseña, sin complicaciones.
              </p>

              {/* Botón CTA Gigante */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="max-w-lg mx-auto mb-4"
              >
                <Button
                  onClick={() => setShowGuestModal(true)}
                  size="lg"
                  className="w-full magenta-gradient text-white font-extrabold text-xl sm:text-2xl md:text-3xl px-6 sm:px-8 py-6 sm:py-8 md:py-10 rounded-2xl shadow-2xl hover:shadow-[#E4007C]/70 transition-all relative overflow-hidden group"
                >
                  {/* Efecto de brillo animado */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-3">
                    <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7" />
                    <span className="whitespace-nowrap">ENTRAR A CHATEAR AHORA</span>
                    <span className="text-2xl sm:text-3xl">🚀</span>
                    <span className="hidden sm:inline text-sm sm:text-base opacity-80">(Modo Invitado)</span>
                  </span>
                </Button>
              </motion.div>

              {/* Micro-texto tranquilizador */}
              <p className="text-xs sm:text-sm text-gray-400 font-medium">
                100% Anónimo. Sin historial. Sin rastro.
              </p>
            </div>
          </motion.div>

          {/* ─── SEPARADOR ─── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <span className="text-sm text-purple-400 font-semibold">O si tienes cuenta</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          </div>

          {/* 📋 FORMULARIO DE LOGIN/REGISTRO - Secundario (gris, más abajo) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 sm:p-8 opacity-80 hover:opacity-100 transition-opacity"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-400">
              Inicia Sesión o Entra Libre
            </h1>
            <p className="text-center text-gray-500 text-sm mb-6">
              Usuarios recurrentes: inicia sesión con tu email y contraseña
            </p>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800/30">
                <TabsTrigger value="login" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-gray-700 text-gray-400 data-[state=active]:text-white">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-gray-400">Email</Label>
                    <div className="relative">
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="bg-gray-800/30 border-gray-700 text-gray-300 pr-10"
                        placeholder="tu@email.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-gray-400">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-gray-800/30 border-gray-700 text-gray-300 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        {showLoginPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold transition-all"
                  >
                    Entrar
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-gray-400">Nombre de usuario</Label>
                    <Input
                      id="username"
                      required
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="bg-gray-800/30 border-gray-700 text-gray-300"
                      placeholder="tu_nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-gray-400">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="bg-gray-800/30 border-gray-700 text-gray-300 pr-10"
                        placeholder="tu@email.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-gray-400">Teléfono (opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="bg-gray-800/30 border-gray-700 text-gray-300"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-gray-400">Edad</Label>
                    <Input
                      id="age"
                      type="number"
                      required
                      min="18"
                      max="120"
                      value={registerData.age}
                      onChange={(e) => {
                        setRegisterData({ ...registerData, age: e.target.value });
                        setAgeError(''); // Limpiar error al escribir
                      }}
                      className={`bg-gray-800/30 border-gray-700 text-gray-300 ${ageError ? 'border-red-500' : ''}`}
                      placeholder="18+"
                    />
                    {ageError && (
                      <p className="text-red-400 text-sm mt-2 font-medium">
                        ⚠️ {ageError}
                      </p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">
                      Debes ser mayor de edad para usar Chactivo
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-gray-400">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showRegisterPassword ? "text" : "password"}
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="bg-gray-800/30 border-gray-700 text-gray-300 pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-400 transition-colors"
                      >
                        {showRegisterPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold transition-all"
                  >
                    Crear Cuenta
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>

      {/* Modal de Invitado */}
      <GuestUsernameModal
        open={showGuestModal}
        onClose={() => setShowGuestModal(false)}
        chatRoomId="global"
      />
    </>
  );
};

export default AuthPage;
  