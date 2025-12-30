
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { useCanonical } from '@/hooks/useCanonical';

const AuthPage = () => {
  // SEO: Canonical tag para página de autenticación
  useCanonical('/auth');

  React.useEffect(() => {
    document.title = "Iniciar Sesión - Chactivo | Chat Gay Chile";

    // ✅ SEO: Noindex para evitar que Google indexe la página de login
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

        <div className="relative z-10 w-full max-w-md">
          <Button
            variant="ghost"
            onClick={() => navigate('/landing')}
            className="mb-6 text-purple-300 hover:text-purple-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-effect rounded-3xl p-8"
          >
            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
              Chactivo
            </h1>
            <p className="text-center text-purple-300 mb-8">
              Tu comunidad te espera 🌈
            </p>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-purple-900/30">
                <TabsTrigger value="login" className="data-[state=active]:bg-purple-600">
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-purple-600">
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email" className="text-purple-200">Email</Label>
                    <div className="relative">
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className="bg-purple-900/30 border-purple-700 text-white pr-10"
                        placeholder="tu@email.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-purple-200">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        className="bg-purple-900/30 border-purple-700 text-white pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
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
                    className="w-full gold-gradient text-purple-950 font-bold hover:scale-105 transition-transform"
                  >
                    Entrar 🚀
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <Label htmlFor="username" className="text-purple-200">Nombre de usuario</Label>
                    <Input
                      id="username"
                      required
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="tu_nombre"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-purple-200">Email</Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="bg-purple-900/30 border-purple-700 text-white pr-10"
                        placeholder="tu@email.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-purple-200">Teléfono (opcional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={registerData.phone}
                      onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-purple-200">Edad</Label>
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
                      className={`bg-purple-900/30 border-purple-700 text-white ${ageError ? 'border-red-500' : ''}`}
                      placeholder="18+"
                    />
                    {ageError && (
                      <p className="text-red-400 text-sm mt-2 font-medium">
                        ⚠️ {ageError}
                      </p>
                    )}
                    <p className="text-purple-400 text-xs mt-1">
                      Debes ser mayor de edad para usar Chactivo
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-purple-200">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showRegisterPassword ? "text" : "password"}
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="bg-purple-900/30 border-purple-700 text-white pr-10"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-purple-400 hover:text-purple-300 transition-colors"
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
                    className="w-full gold-gradient text-purple-950 font-bold hover:scale-105 transition-transform"
                  >
                    Crear Cuenta 🎉
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default AuthPage;
  