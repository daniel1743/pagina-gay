
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Eye, EyeOff, Check } from 'lucide-react';
import { useCanonical } from '@/hooks/useCanonical';
import { toast } from '@/components/ui/use-toast';

// 4 avatares predefinidos
const AVATAR_OPTIONS = [
  { id: 'avataaars', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=avatar1', name: 'Clásico' },
  { id: 'bottts', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=avatar2', name: 'Robot' },
  { id: 'pixel-art', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=avatar3', name: 'Retro' },
  { id: 'identicon', url: 'https://api.dicebear.com/7.x/identicon/svg?seed=avatar4', name: 'Geométrico' }
];

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
  const { login, register, signInAsGuest } = useAuth();
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

  // Estados para formulario de invitado
  const [guestNickname, setGuestNickname] = useState('');
  const [guestAge, setGuestAge] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [acceptRules, setAcceptRules] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [guestError, setGuestError] = useState('');

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    setGuestError('');

    // Validaciones
    if (!guestNickname.trim()) {
      setGuestError('Ingresa tu nickname');
      return;
    }
    if (guestNickname.trim().length < 3) {
      setGuestError('El nickname debe tener al menos 3 caracteres');
      return;
    }

    const parsedAge = parseInt(guestAge, 10);
    if (Number.isNaN(parsedAge)) {
      setGuestError('Ingresa tu edad en números');
      return;
    }
    if (parsedAge < 18) {
      setGuestError('Debes ser mayor de 18 años');
      return;
    }

    if (!acceptRules) {
      setGuestError('Debes aceptar las reglas del chat');
      return;
    }

    setIsGuestLoading(true);

    try {
      // Guardar flags en sessionStorage
      sessionStorage.setItem(`age_verified_${guestNickname.trim()}`, 'true');
      sessionStorage.setItem(`rules_accepted_${guestNickname.trim()}`, 'true');

      // Crear usuario guest en Firebase
      await signInAsGuest(guestNickname.trim(), selectedAvatar.url);

      toast({
        title: "¡Bienvenido! 🎉",
        description: `Hola ${guestNickname.trim()}, ya puedes chatear`,
      });

      // Redirigir al chat
      navigate('/chat/global', { replace: true });
    } catch (error) {
      console.error('Error creating guest user:', error);
      setGuestError('Error al entrar. Intenta de nuevo.');
      setIsGuestLoading(false);
    }
  };

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

          {/* 🚀 FORMULARIO DIRECTO: ACCESO INVITADO - Prioridad #1 */}
          <style>{`
            .modal-scroll::-webkit-scrollbar {
              display: none;
            }
            .modal-scroll {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}</style>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div
              className="modal-scroll"
              style={{
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '10px' }}>
                  Entra SIN Registro
                </h1>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', marginBottom: '30px' }}>
                  Completa estos datos para empezar a chatear
                </p>

                <form onSubmit={handleGuestSubmit} style={{ textAlign: 'left' }}>
                  {/* Nickname */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                      Tu Nickname *
                    </label>
                    <input
                      type="text"
                      value={guestNickname}
                      onChange={(e) => setGuestNickname(e.target.value)}
                      placeholder="Ej: Carlos23"
                      maxLength={20}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid #667eea',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333'
                      }}
                    />
                  </div>

                  {/* Edad */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                      Tu Edad *
                    </label>
                    <input
                      type="number"
                      value={guestAge}
                      onChange={(e) => setGuestAge(e.target.value)}
                      placeholder="Ej: 24"
                      min="18"
                      required
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: '2px solid #667eea',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333'
                      }}
                    />
                  </div>

                  {/* Avatar */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: 'white', marginBottom: '12px' }}>
                      Elige tu Avatar *
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                      {AVATAR_OPTIONS.map((avatar) => (
                        <button
                          key={avatar.id}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar)}
                          style={{
                            position: 'relative',
                            padding: '10px',
                            borderRadius: '10px',
                            border: selectedAvatar.id === avatar.id ? '3px solid white' : '2px solid rgba(255,255,255,0.3)',
                            backgroundColor: selectedAvatar.id === avatar.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {selectedAvatar.id === avatar.id && (
                            <div style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Check style={{ width: '14px', height: '14px', color: '#667eea' }} />
                            </div>
                          )}
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#f5f5f5' }}
                          />
                          <span style={{ fontSize: '11px', color: 'white', fontWeight: '500' }}>
                            {avatar.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Checkbox Reglas */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'white'
                    }}>
                      <input
                        type="checkbox"
                        checked={acceptRules}
                        onChange={(e) => setAcceptRules(e.target.checked)}
                        required
                        style={{
                          width: '18px',
                          height: '18px',
                          marginTop: '2px',
                          cursor: 'pointer',
                          accentColor: 'white'
                        }}
                      />
                      <span>
                        Acepto las reglas del chat. Tengo +18 años y entiendo que debo respetar a los demás usuarios.
                      </span>
                    </label>
                  </div>

                  {/* Error */}
                  {guestError && (
                    <div style={{
                      padding: '12px',
                      marginBottom: '20px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '8px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: '600'
                    }}>
                      ⚠️ {guestError}
                    </div>
                  )}

                  {/* Botón Submit */}
                  <button
                    type="submit"
                    disabled={isGuestLoading}
                    style={{
                      width: '100%',
                      padding: '15px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#667eea',
                      background: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: isGuestLoading ? 'not-allowed' : 'pointer',
                      opacity: isGuestLoading ? '0.7' : '1',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                    }}
                  >
                    {isGuestLoading ? 'Entrando...' : 'Entrar a Chatear 🚀'}
                  </button>
                </form>

                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '20px', lineHeight: '1.5' }}>
                  ✨ Sin registro • 100% Gratis • Anónimo
                </p>
              </div>
            </div>
          </motion.div>

          {/* ─── SEPARADOR ─── */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
            <span className="text-sm text-purple-400 font-semibold">O si tienes cuenta</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          </div>

          {/* 📋 FORMULARIO DE LOGIN/REGISTRO - Secundario */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="glass-effect rounded-2xl p-6 sm:p-8 opacity-80 hover:opacity-100 transition-opacity"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-gray-400">
              Iniciar Sesión o Registrarse
            </h2>
            <p className="text-center text-gray-500 text-sm mb-6">
              ¿Ya tienes cuenta? Inicia sesión aquí
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
    </>
  );
};

export default AuthPage;
  