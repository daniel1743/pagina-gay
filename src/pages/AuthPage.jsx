
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

const AuthPage = () => {
  React.useEffect(() => {
    document.title = "Iniciar Sesión - Chactivo | Chat Gay Chile";
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (login(loginData.email, loginData.password)) {
      navigate('/chat');
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();
    if (register(registerData)) {
      navigate('/chat');
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
            onClick={() => navigate('/')}
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
                    <Input
                      id="login-email"
                      type="email"
                      required
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="tu@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="login-password" className="text-purple-200">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      required
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="••••••••"
                    />
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
                    <Input
                      id="email"
                      type="email"
                      required
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="tu@email.com"
                    />
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
                      value={registerData.age}
                      onChange={(e) => setRegisterData({ ...registerData, age: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="18+"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="text-purple-200">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="bg-purple-900/30 border-purple-700 text-white"
                      placeholder="••••••••"
                    />
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
  