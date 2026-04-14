import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Mail, Eye, EyeOff } from 'lucide-react';
import { useCanonical } from '@/hooks/useCanonical';
import { track, trackPageExit, trackPageView } from '@/services/eventTrackingService';
import { PROFILE_ROLE_OPTIONS, normalizeProfileRole } from '@/config/profileRoles';
import CommunityPolicyCompactNotice from '@/components/policy/CommunityPolicyCompactNotice';
import { COMMUNITY_POLICY_STORAGE, COMMUNITY_POLICY_VERSION, getPolicyCopy } from '@/content/communityPolicy';

const AuthPage = () => {
  // SEO: Canonical tag para página de autenticación
  useCanonical('/auth');

  useEffect(() => {
    const previousTitle = document.title;
    const metaRobots = document.querySelector('meta[name="robots"]');
    const hadMetaRobots = !!metaRobots;
    const previousRobots = metaRobots?.getAttribute('content') || '';
    const metaDescription = document.querySelector('meta[name="description"]');
    const hadMetaDescription = !!metaDescription;
    const previousDescription = metaDescription?.getAttribute('content') || '';

    document.title = "Acceder a Chactivo | Login y Registro";

    let ensuredMetaRobots = metaRobots;
    if (!ensuredMetaRobots) {
      ensuredMetaRobots = document.createElement('meta');
      ensuredMetaRobots.setAttribute('name', 'robots');
      document.head.appendChild(ensuredMetaRobots);
    }
    ensuredMetaRobots.setAttribute('content', 'noindex, nofollow, noarchive');

    let ensuredMetaDescription = metaDescription;
    if (!ensuredMetaDescription) {
      ensuredMetaDescription = document.createElement('meta');
      ensuredMetaDescription.setAttribute('name', 'description');
      document.head.appendChild(ensuredMetaDescription);
    }
    ensuredMetaDescription.setAttribute('content', 'Accede a tu cuenta de Chactivo o crea una nueva para usar funciones avanzadas.');

    return () => {
      document.title = previousTitle;
      const currentMetaRobots = document.querySelector('meta[name="robots"]');
      if (currentMetaRobots) {
        if (hadMetaRobots) {
          currentMetaRobots.setAttribute('content', previousRobots);
        } else {
          currentMetaRobots.remove();
        }
      }
      const currentMetaDescription = document.querySelector('meta[name="description"]');
      if (currentMetaDescription) {
        if (hadMetaDescription) {
          currentMetaDescription.setAttribute('content', previousDescription);
        } else {
          currentMetaDescription.remove();
        }
      }
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, user } = useAuth();
  const policyCopy = getPolicyCopy('es');
  const pageStartRef = useRef(Date.now());
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    age: '',
    profileRole: '',
  });
  const [ageError, setAgeError] = useState('');
  const [roleError, setRoleError] = useState('');
  const [registerRulesAccepted, setRegisterRulesAccepted] = useState(false);
  const [registerRulesError, setRegisterRulesError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const getRedirectPath = () => {
    const queryRedirect = new URLSearchParams(location.search).get('redirect');
    const stateRedirect = location.state?.redirectTo;
    const rawRedirect = stateRedirect || queryRedirect || '/home';
    return typeof rawRedirect === 'string' && rawRedirect.startsWith('/') ? rawRedirect : '/home';
  };

  useEffect(() => {
    pageStartRef.current = Date.now();
    const redirectTarget = getRedirectPath();
    trackPageView('/auth', 'Auth - Chactivo', { user }).catch(() => {});
    track('auth_page_view', { redirect_to: redirectTarget }, { user }).catch(() => {});

    return () => {
      const timeOnPage = Math.max(0, Math.round((Date.now() - pageStartRef.current) / 1000));
      trackPageExit('/auth', timeOnPage, { user }).catch(() => {});
    };
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    track('auth_submit', { mode: 'login' }, { user }).catch(() => {});
    const success = await login(loginData.email, loginData.password);
    if (success) {
      track('auth_success', { mode: 'login' }, { user }).catch(() => {});
      navigate(getRedirectPath(), { replace: true });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAgeError('');
    setRoleError('');
    setRegisterRulesError('');

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
    const normalizedRole = normalizeProfileRole(registerData.profileRole);
    if (!normalizedRole) {
      setRoleError('Selecciona tu rol para registrarte.');
      return;
    }
    if (!registerRulesAccepted) {
      setRegisterRulesError('Debes aceptar las normas y políticas de seguridad.');
      return;
    }

    track('auth_submit', { mode: 'register' }, { user }).catch(() => {});
    const success = await register({
      ...registerData,
      profileRole: normalizedRole,
      communityPolicyAccepted: true,
      communityPolicyAcceptedAt: Date.now(),
      communityPolicyVersion: COMMUNITY_POLICY_VERSION,
    });
    if (success) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMMUNITY_POLICY_STORAGE.acceptedFlag, '1');
        localStorage.setItem(COMMUNITY_POLICY_STORAGE.acceptedAt, String(Date.now()));
        localStorage.setItem(COMMUNITY_POLICY_STORAGE.version, COMMUNITY_POLICY_VERSION);
      }
      track('auth_success', { mode: 'register' }, { user }).catch(() => {});
      navigate(getRedirectPath(), { replace: true });
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

          {/* Iniciar Sesión / Registrarse */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="glass-effect rounded-2xl p-6 sm:p-8 border border-purple-500/20"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-center mb-2 text-foreground">
              Iniciar Sesión o Registrarse
            </h1>
            <p className="text-center text-muted-foreground text-sm mb-6">
              Accede con tu cuenta o crea una nueva
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
                  <CommunityPolicyCompactNotice />
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
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
                        setAgeError('');
                      }}
                      className={`bg-gray-800/30 border-gray-700 text-gray-300 ${ageError ? 'border-red-500' : ''}`}
                      placeholder="18+"
                    />
                    <p className="mt-2 text-xs text-cyan-300/90">
                      {policyCopy.privacyNotice}
                    </p>
                    {ageError && (
                      <p className="text-red-400 text-sm mt-2 font-medium">
                        ⚠️ {ageError}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="register-role" className="text-gray-400">Rol</Label>
                    <select
                      id="register-role"
                      required
                      value={registerData.profileRole}
                      onChange={(e) => {
                        setRegisterData({ ...registerData, profileRole: e.target.value });
                        setRoleError('');
                      }}
                      className={`w-full h-10 px-3 rounded-md bg-gray-800/30 border text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        roleError ? 'border-red-500' : 'border-gray-700'
                      }`}
                    >
                      <option value="">Selecciona tu rol</option>
                      {PROFILE_ROLE_OPTIONS.map((roleOption) => (
                        <option key={roleOption.value} value={roleOption.value}>
                          {roleOption.label}
                        </option>
                      ))}
                    </select>
                    {roleError && (
                      <p className="text-red-400 text-sm mt-2 font-medium">
                        ⚠️ {roleError}
                      </p>
                    )}
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
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <label className="flex items-start gap-3 text-sm text-slate-200">
                      <input
                        type="checkbox"
                        checked={registerRulesAccepted}
                        onChange={(e) => {
                          setRegisterRulesAccepted(e.target.checked);
                          setRegisterRulesError('');
                        }}
                        className="mt-1 h-4 w-4"
                      />
                      <span>{policyCopy.acceptanceLabel}</span>
                    </label>
                    {registerRulesError ? (
                      <p className="mt-2 text-sm font-medium text-red-400">⚠️ {registerRulesError}</p>
                    ) : null}
                  </div>
                  <CommunityPolicyCompactNotice />
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
  
