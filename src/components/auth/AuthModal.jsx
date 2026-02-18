import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Mail, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

/**
 * Modal de Autenticación (Login/Registro)
 * Para usuarios invitados que quieren crear una cuenta o iniciar sesión
 */
export const AuthModal = ({ open, onClose }) => {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    age: ''
  });
  const [ageError, setAgeError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const success = await login(loginData.email, loginData.password);
      if (success) {
        onClose();
        // No navegamos, el usuario ya está en el chat
        // El toast ya se muestra en AuthContext
      }
      // Si falla, el toast ya se muestra en AuthContext
    } catch (error) {
      console.error('Error en login:', error);
      // El toast ya se muestra en AuthContext, pero por si acaso:
      if (!error.handled) {
        toast({
          title: "Error al iniciar sesión",
          description: error.message || "Intenta de nuevo",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAgeError('');
    setIsLoading(true);

    // ✅ VALIDACIÓN CRÍTICA: Verificar edad mínima (18 años)
    const age = parseInt(registerData.age);
    if (isNaN(age) || age < 18) {
      setAgeError('Debes ser mayor de 18 años para registrarte. Esta es una comunidad para adultos.');
      setIsLoading(false);
      return;
    }
    if (age > 120) {
      setAgeError('Por favor ingresa una edad válida.');
      setIsLoading(false);
      return;
    }

    try {
      const success = await register(registerData);
      if (success) {
        onClose();
        // No navegamos, el usuario ya está en el chat
        // El toast ya se muestra en AuthContext
      }
      // Si falla, el toast ya se muestra en AuthContext
    } catch (error) {
      console.error('Error en registro:', error);
      // El toast ya se muestra en AuthContext, pero por si acaso:
      if (!error.handled) {
        toast({
          title: "Error al crear cuenta",
          description: error.message || "Intenta de nuevo",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] p-0 overflow-hidden">
        <style>{`
          .modal-scroll::-webkit-scrollbar {
            display: none;
          }
          .modal-scroll {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
        <div
          className="modal-scroll"
          style={{
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'Arial, sans-serif',
            padding: '40px',
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              margin: '0 auto',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '20px',
              padding: '40px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              textAlign: 'center'
            }}
          >
            <DialogHeader>
              <DialogTitle className="sr-only">Iniciar Sesión o Registrarse</DialogTitle>
              <DialogDescription className="sr-only">Accede a tu cuenta o crea una nueva</DialogDescription>
            </DialogHeader>
            
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea', marginBottom: '10px' }}>
              Iniciar Sesión o Registrarse
            </h1>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '30px' }}>
              Accede a tu cuenta o crea una nueva para guardar tu perfil
            </p>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100">
                <TabsTrigger 
                  value="login" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#667eea] text-gray-600"
                >
                  Iniciar Sesión
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#667eea] text-gray-600"
                >
                  Registrarse
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4" style={{ textAlign: 'left' }}>
                  <div>
                    <Label htmlFor="login-email" style={{ color: '#333', marginBottom: '8px', display: 'block' }}>
                      Email *
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-email"
                        type="email"
                        required
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '16px',
                          border: '2px solid #667eea',
                          borderRadius: '10px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: 'white',
                          color: '#333',
                          paddingRight: '40px'
                        }}
                        placeholder="tu@email.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="login-password" style={{ color: '#333', marginBottom: '8px', display: 'block' }}>
                      Contraseña *
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showLoginPassword ? "text" : "password"}
                        required
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '16px',
                          border: '2px solid #667eea',
                          borderRadius: '10px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: 'white',
                          color: '#333',
                          paddingRight: '40px'
                        }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '15px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? '0.7' : '1',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4" style={{ textAlign: 'left' }}>
                  <div>
                    <Label htmlFor="age" style={{ color: '#333', marginBottom: '8px', display: 'block' }}>
                      Edad *
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      required
                      min="18"
                      max="120"
                      value={registerData.age}
                      onChange={(e) => {
                        setRegisterData({ ...registerData, age: e.target.value });
                        setAgeError('');
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        fontSize: '16px',
                        border: ageError ? '2px solid #f33' : '2px solid #667eea',
                        borderRadius: '10px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        backgroundColor: 'white',
                        color: '#333'
                      }}
                      placeholder="18+"
                    />
                    {ageError && (
                      <p style={{ color: '#c33', fontSize: '13px', marginTop: '8px', fontWeight: '600' }}>
                        ⚠️ {ageError}
                      </p>
                    )}
                    <p style={{ color: '#999', fontSize: '12px', marginTop: '4px' }}>
                      Debes ser mayor de edad
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="email" style={{ color: '#333', marginBottom: '8px', display: 'block' }}>
                      Email *
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        type="email"
                        required
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '16px',
                          border: '2px solid #667eea',
                          borderRadius: '10px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: 'white',
                          color: '#333',
                          paddingRight: '40px'
                        }}
                        placeholder="tu@email.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="password" style={{ color: '#333', marginBottom: '8px', display: 'block' }}>
                      Contraseña *
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showRegisterPassword ? "text" : "password"}
                        required
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px',
                          fontSize: '16px',
                          border: '2px solid #667eea',
                          borderRadius: '10px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          backgroundColor: 'white',
                          color: '#333',
                          paddingRight: '40px'
                        }}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
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
                    disabled={isLoading}
                    style={{
                      width: '100%',
                      padding: '15px',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '10px',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? '0.7' : '1',
                      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                    }}
                  >
                    {isLoading ? 'Creando cuenta...' : 'Crear Cuenta'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

