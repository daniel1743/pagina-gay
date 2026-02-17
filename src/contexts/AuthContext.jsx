import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import {
  createUserProfile,
  getUserProfile,
  updateUserProfile as updateUserProfileService,
  updateUserTheme as updateUserThemeService,
  addQuickPhrase as addQuickPhraseService,
  removeQuickPhrase as removeQuickPhraseService,
  upgradeToPremium as upgradeToPremiumService,
} from '@/services/userService';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/components/ui/use-toast';
import { trackUserRegister, trackUserLogin } from '@/services/eventTrackingService';
import { recordUserConnection, checkVerificationMaintenance } from '@/services/verificationService';
import { checkUserSanctions } from '@/services/sanctionsService';
import { createWelcomeNotification } from '@/services/systemNotificationsService';
import {
  getGuestIdentity,
  createGuestIdentity,
  getTempGuestData,
  saveTempGuestData,
  linkGuestToFirebase,
  clearGuestIdentity,
  hasGuestIdentity,
} from '@/utils/guestIdentity';
import { crearTarjetaAutomatica } from '@/services/tarjetaService';
import { removeRewardFromUser, REWARD_TYPES } from '@/services/rewardsService';

// ⚡ Helper para agregar timeout a promesas de Firestore (evita delays de 41+ segundos)
const withTimeout = (promise, timeoutMs = 3000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs)
    ),
  ]);
};

// Valor por defecto para evitar crash durante ErrorBoundary recovery o StrictMode remount
// Cuando el Provider está desmontado brevemente, los componentes reciben este fallback
const DEFAULT_AUTH_CONTEXT = {
  user: null,
  loading: true,
  guestMessageCount: 0,
  setGuestMessageCount: () => {},
  showWelcomeTour: false,
  setShowWelcomeTour: () => {},
  guestAuthInProgress: false,
  setGuestAuthInProgress: () => {},
  login: async () => {},
  register: async () => {},
  signInAsGuest: async () => false,
  logout: async () => {},
  updateProfile: async () => {},
  upgradeToPremium: async () => {},
  updateThemeSetting: async () => {},
  addQuickPhrase: async () => {},
  removeQuickPhrase: async () => {},
  updateAnonymousUserProfile: async () => {},
  switchToGenericIdentity: async () => false,
  restoreAdminIdentity: async () => false,
};

export const AuthContext = createContext(DEFAULT_AUTH_CONTEXT);

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context || DEFAULT_AUTH_CONTEXT;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const [guestAuthInProgress, setGuestAuthInProgress] = useState(false); // ✅ FASE 2: Estado para loading overlay
  const isLoggingOutRef = useRef(false); // Ref para evitar auto-login después de logout
  const loadingTimeoutRef = useRef(null); // ✅ FIX: Timeout de seguridad para loading
  const authStateChangedCalledRef = useRef(false); // ✅ FIX: Flag para rastrear si onAuthStateChanged se ha ejecutado
  const autoRestoreAttemptedRef = useRef(false); // Evitar loop en useEffect de auto-restauración

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    console.log('[AUTH] 🔄 Configurando onAuthStateChanged listener...');
    
    // ✅ FIX: Resetear el flag cuando se recrea el listener (React.StrictMode)
    authStateChangedCalledRef.current = false;
    
    // ✅ FIX: Timeout de seguridad - Si onAuthStateChanged no se ejecuta en 3 segundos, forzar loading a false
    loadingTimeoutRef.current = setTimeout(() => {
      if (!authStateChangedCalledRef.current) {
        console.warn('[AUTH] ⚠️ Timeout de seguridad: onAuthStateChanged no se ejecutó en 3s, forzando loading a false');
        setLoading(false);
      }
    }, 3000); // 3 segundos máximo
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // ✅ FIX: Marcar que onAuthStateChanged se ejecutó
      authStateChangedCalledRef.current = true;
      
      // ✅ FIX: Limpiar timeout cuando se actualiza el estado
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      console.log('[AUTH] 🔄 onAuthStateChanged ejecutado, firebaseUser:', firebaseUser ? 'presente' : 'null');
      if (firebaseUser) {
        try {
          if (firebaseUser.isAnonymous) {
            let guestUser;

            // ⚡ NUEVO SISTEMA: Priorizar identidad persistente con UUID
            const identity = getGuestIdentity();
            const tempData = getTempGuestData();

            // 🔒 PRIORIDAD 1: Identidad persistente (con UUID)
            if (identity) {
              console.log('[AUTH] ✅ Identidad persistente detectada:', identity.guestId);

              guestUser = {
                id: firebaseUser.uid,
                username: identity.nombre,
                isGuest: true,
                isAnonymous: true,
                isPremium: false,
                verified: false,
                avatar: identity.avatar,
                quickPhrases: [],
                theme: {},
                guestId: identity.guestId, // ✅ UUID inmutable
              };

              // Vincular con Firebase UID si no está vinculado
              if (identity.firebaseUid !== firebaseUser.uid) {
                linkGuestToFirebase(firebaseUser.uid);
              }

              setGuestMessageCount(0);
              setUser(guestUser);
              setLoading(false); // ✅ FIX: Asegurar que loading se actualice

              // Background: Sync con Firestore (con timeout de 3 segundos)
              withTimeout(getDoc(doc(db, 'guests', firebaseUser.uid)), 3000)
                .then(snap => {
                  if (snap.exists()) {
                    const guestData = snap.data();
                    setGuestMessageCount(guestData.messageCount || 0);
                  }
                })
                .catch(() => {
                  // Timeout o error - no crítico, continuar con datos locales
                });

              return;
            }

            // 🔒 PRIORIDAD 2: Datos temporales del modal (identidad ya creada)
            if (tempData) {
              console.log('[AUTH] ✅ Datos temporales detectados, actualizando con ID real de Firebase...');

              const tempUsername = tempData.nombre || 'Invitado';
              const tempAvatar = tempData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest';
              const existingGuestId = tempData.guestId; // UUID ya creado optimísticamente

              // Vincular con Firebase UID real
              linkGuestToFirebase(firebaseUser.uid);

              console.log('[AUTH] ✅ Actualizando usuario con ID real de Firebase:', firebaseUser.uid);

              // Actualizar usuario con ID REAL de Firebase
              guestUser = {
                id: firebaseUser.uid, // ✅ ID real de Firebase (reemplaza temp_xxx)
                username: tempUsername,
                isGuest: true,
                isAnonymous: true,
                isPremium: false,
                verified: false,
                avatar: tempAvatar,
                quickPhrases: [],
                theme: {},
                guestId: existingGuestId, // ✅ Mantener el UUID existente
              };

              setGuestMessageCount(0);
              setUser(guestUser); // ✅ Actualizar con ID real
              setLoading(false); // ✅ FIX: Asegurar que loading se actualice

              // 🚀 Guardar en Firestore EN BACKGROUND (con timeout de 3 segundos)
              const guestRef = doc(db, 'guests', firebaseUser.uid);
              withTimeout(setDoc(guestRef, {
                username: tempUsername,
                avatar: tempAvatar,
                guestId: existingGuestId, // ✅ UUID ya creado
                createdAt: new Date().toISOString(),
                messageCount: 0,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }), 3000)
              .then(() => {
                console.log('[AUTH] ✅ Firestore: Invitado guardado con UUID');
              })
              .catch((err) => {
                console.warn('[AUTH] ⚠️ Error guardando en Firestore (timeout o error, no crítico):', err.message);
              });

              return;
            }

            // ⚡ FALLBACK: Crear usuario básico INMEDIATAMENTE (no esperar Firestore)
            console.log('[AUTH] ⚠️ Sin identidad ni datos temp, creando usuario básico...');

            guestUser = {
              id: firebaseUser.uid,
              username: 'Invitado',
              isGuest: true,
              isAnonymous: true,
              isPremium: false,
              verified: false,
              avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
              quickPhrases: [],
              theme: {},
            };
            setGuestMessageCount(0);
            setUser(guestUser);
            setLoading(false); // ✅ FIX: Asegurar que loading se actualice

            // 🚀 Intentar cargar de Firestore EN BACKGROUND (con timeout de 3 segundos)
            withTimeout(getDoc(doc(db, 'guests', firebaseUser.uid)), 3000)
              .then(guestSnap => {
                if (guestSnap.exists()) {
                  const guestData = guestSnap.data();
                  if (guestData.username && guestData.username !== 'Invitado') {
                    setUser({
                      id: firebaseUser.uid,
                      username: guestData.username,
                      isGuest: true,
                      isAnonymous: true,
                      isPremium: false,
                      verified: false,
                      avatar: guestData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
                      quickPhrases: [],
                      theme: {},
                    });
                    setGuestMessageCount(guestData.messageCount || 0);
                  }
                }
              })
              .catch(() => {
                // Timeout o error - no crítico, continuar con usuario básico
              });
          } else {
            // Usuario registrado - obtener perfil de Firestore
            let userProfile;
            try {
              userProfile = await getUserProfile(firebaseUser.uid);
              // Si getUserProfile retorna null por error interno, crear perfil básico
              if (!userProfile) {
                console.warn('getUserProfile returned null, creating basic profile');
                userProfile = {
                  id: firebaseUser.uid,
                  username: `Usuario${firebaseUser.uid.slice(0, 6)}`,
                  email: firebaseUser.email || 'email@example.com',
                  isPremium: false,
                  verified: false,
                  isGuest: false,
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
                };
              }
            } catch (profileError) {
              // Si hay error, crear perfil básico local
              console.error('Error getting user profile, using basic profile:', profileError);
              userProfile = {
                id: firebaseUser.uid,
                username: `Usuario${firebaseUser.uid.slice(0, 6)}`,
                email: firebaseUser.email || 'email@example.com',
                isPremium: false,
                verified: false,
                isGuest: false,
                avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              };
            }
            
            // Verificar sanciones antes de permitir acceso
            const sanctions = await checkUserSanctions(firebaseUser.uid);
            
            if (sanctions.isBanned) {
              // Usuario está baneado
              await signOut(auth);
              setLoading(false); // ✅ FIX: Asegurar que loading se actualice antes de return
              toast({
                title: "Acceso Denegado",
                description: sanctions.banType === 'perm_ban' 
                  ? "Tu cuenta ha sido expulsada permanentemente por violar las normas de la comunidad."
                  : "Tu cuenta está suspendida temporalmente. Revisa tu email para más información.",
                variant: "destructive",
              });
              return;
            }
            
            // ✅ SUPER ADMIN: Asignar role automáticamente si es el email autorizado
            if (firebaseUser.email === 'caribenosvenezolanos@gmail.com' && userProfile.role !== 'admin') {
              console.log('🛡️ [AUTH] Super Admin detectado, asignando rol...');
              userProfile.role = 'admin';

              // Actualizar en Firestore para persistir
              try {
                await updateUserProfileService(firebaseUser.uid, { role: 'admin' });
                console.log('✅ [AUTH] Rol de admin asignado y guardado en Firestore');
              } catch (error) {
                console.error('❌ [AUTH] Error al guardar rol de admin:', error);
              }
            }

            // 🔄 Verificar expiración PRO por inactividad de 48h
            if (userProfile.isProUser) {
              try {
                const lastActive = userProfile.lastActiveAt?.toMillis?.() ||
                                   userProfile.lastActiveAt ||
                                   userProfile.lastSeenAt?.toMillis?.() ||
                                   userProfile.lastSeenAt ||
                                   userProfile.updatedAt?.toMillis?.() ||
                                   userProfile.updatedAt ||
                                   userProfile.lastSeen?.toMillis?.() ||
                                   userProfile.lastSeen;

                if (lastActive) {
                  const horasSinConexion = (Date.now() - lastActive) / (1000 * 60 * 60);
                  if (horasSinConexion > 48) {
                    console.log(`⚠️ [PRO] Usuario ${userProfile.username} inactivo ${Math.round(horasSinConexion)}h - revocando PRO`);
                    await removeRewardFromUser(firebaseUser.uid, REWARD_TYPES.PRO_USER);
                    userProfile.isProUser = false;
                    userProfile.canUploadSecondPhoto = false;
                    userProfile.hasFeaturedCard = false;
                    userProfile.hasRainbowBorder = false;
                    userProfile.hasProBadge = false;
                    toast({
                      title: "Estado PRO expirado",
                      description: "Tu premio PRO ha expirado por más de 48 horas sin conectarte. ¡Sigue participando para recuperarlo!",
                    });
                  }
                }
              } catch (proCheckError) {
                console.warn('Error verificando expiración PRO:', proCheckError);
              }
            }

            setUser(userProfile);
            setGuestMessageCount(0); // Los usuarios registrados no tienen límite
            setLoading(false); // ✅ FIX: Asegurar que loading se actualice

            // Registrar conexión para sistema de verificación (en background, no bloquea)
            recordUserConnection(firebaseUser.uid).catch(() => {});

            // Verificar mantenimiento de verificación (en background, no bloquea)
            checkVerificationMaintenance(firebaseUser.uid).catch(() => {});
          }
        } catch (error) {
          console.error('[AUTH] ❌ ERROR CRÍTICO al cargar perfil:', error);
          console.error('[AUTH] ❌ Error code:', error.code);
          console.error('[AUTH] ❌ Error message:', error.message);
          console.error('[AUTH] ❌ UID del usuario:', firebaseUser?.uid);

          // ✅ NO crear nuevo usuario anónimo - eso perdería la sesión actual
          // En su lugar, usar perfil básico para mantener la sesión
          if (firebaseUser.isAnonymous) {
            console.log('[AUTH] 🔄 Usuario anónimo con error en Firestore - usando perfil básico');
            const basicGuestProfile = {
              id: firebaseUser.uid,
              username: 'Invitado',
              isGuest: true,
              isAnonymous: true,
              isPremium: false,
              verified: false,
              avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${firebaseUser.uid}`,
              quickPhrases: [],
              theme: {},
            };
            setUser(basicGuestProfile);
            setLoading(false); // ✅ FIX: Asegurar que loading se actualice
          } else {
            console.log('[AUTH] 🔄 Usuario registrado con error en Firestore - usando perfil básico');
            const basicProfile = {
              id: firebaseUser.uid,
              username: `Usuario${firebaseUser.uid.slice(0, 6)}`,
              email: firebaseUser.email || 'email@example.com',
              isGuest: false,
              isAnonymous: false,
              isPremium: false,
              verified: false,
              avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              quickPhrases: [],
              theme: {},
            };
            setUser(basicProfile);
            setLoading(false); // ✅ FIX: Asegurar que loading se actualice
          }
        }
      } else {
        // No hay usuario Firebase — la restauración se hace en useEffect cuando loading=false
        setUser(null);
        setGuestMessageCount(0);

        if (isLoggingOutRef.current) {
          setTimeout(() => {
            isLoggingOutRef.current = false;
          }, 1000);
        }
      }
      console.log('[AUTH] ✅ setLoading(false) llamado');
      setLoading(false);
    });

    return () => {
      console.log('[AUTH] 🧹 Limpiando onAuthStateChanged listener...');
      unsubscribe();
      // ✅ FIX: Limpiar timeout al desmontar
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    };
  }, []);

  // ✅ BAÚL: Crear tarjeta automática cuando el usuario se conecta
  useEffect(() => {
    if (!user || !user.id) return;

    const crearTarjetaSiNoExiste = async () => {
      try {
        console.log('[AUTH/BAUL] 📋 Verificando/creando tarjeta para:', user.username, user.id);

        await crearTarjetaAutomatica({
          odIdUsuari: user.id,
          username: user.username || 'Usuario',
          esInvitado: user.isGuest || user.isAnonymous || false,
          edad: user.edad || null,
          avatar: user.avatar || null
        });

        console.log('[AUTH/BAUL] ✅ Tarjeta verificada/creada para:', user.username);
      } catch (error) {
        console.error('[AUTH/BAUL] Error creando tarjeta:', error);
      }
    };

    // Ejecutar en background, no bloquear la UI
    crearTarjetaSiNoExiste();
  }, [user?.id]); // Solo ejecutar cuando cambia el user.id

  /**
   * Inicio de sesión con email y contraseña
   * ✅ Firebase hashea automáticamente las contraseñas (bcrypt)
   * ✅ Validación del lado del servidor
   */
  const login = async (email, password) => {
    try {
      // Firebase maneja el hash y validación de contraseña automáticamente
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Obtener perfil del usuario desde Firestore
      const userProfile = await getUserProfile(userCredential.user.uid);
      
      // Verificar sanciones antes de permitir acceso
      const sanctions = await checkUserSanctions(userCredential.user.uid);
      
      if (sanctions.isBanned) {
        // Usuario está baneado
        await signOut(auth);
        toast({
          title: "Acceso Denegado",
          description: sanctions.banType === 'perm_ban' 
            ? "Tu cuenta ha sido expulsada permanentemente por violar las normas de la comunidad."
            : "Tu cuenta está suspendida temporalmente. Revisa tu email para más información.",
          variant: "destructive",
        });
        return false;
      }
      
      setUser(userProfile);

      // Track login (Analytics interno + GA4)
      trackUserLogin('email', { user: { id: userCredential.user.uid } });

      // Registrar conexión para sistema de verificación
      recordUserConnection(userCredential.user.uid);
      
      // Verificar mantenimiento de verificación
      checkVerificationMaintenance(userCredential.user.uid);

      toast({
        title: "¡Bienvenido de vuelta! 🌈",
        description: `Hola ${userProfile.username}`,
      });

      return true;
    } catch (error) {
      console.error('Login error:', error);

      let errorMessage = "Email o contraseña incorrectos";

      // Mensajes de error específicos
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No existe una cuenta con este email";
          break;
        case 'auth/wrong-password':
          errorMessage = "Contraseña incorrecta";
          break;
        case 'auth/invalid-credential':
          errorMessage = "Email o contraseña incorrectos. Verifica tus datos e intenta nuevamente";
          break;
        case 'auth/invalid-email':
          errorMessage = "Email inválido";
          break;
        case 'auth/user-disabled':
          errorMessage = "Esta cuenta ha sido deshabilitada";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Demasiados intentos fallidos. Intenta más tarde";
          break;
        default:
          errorMessage = error.message;
      }

      toast({
        title: "Error de autenticación",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  };

  /**
   * Registro de nuevo usuario
   * ✅ Firebase hashea automáticamente las contraseñas
   * ✅ Validación de email único del lado del servidor
   */
  const register = async (userData) => {
    try {
      // Validaciones básicas del lado del cliente
      if (!userData.email || !userData.password || !userData.username) {
        toast({
          title: "Datos incompletos",
          description: "Por favor completa todos los campos requeridos",
          variant: "destructive",
        });
        return false;
      }

      if (userData.age && parseInt(userData.age) < 18) {
        toast({
          title: "Edad insuficiente",
          description: "Debes ser mayor de 18 años para registrarte",
          variant: "destructive",
        });
        return false;
      }

      if (userData.password.length < 6) {
        toast({
          title: "Contraseña débil",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive",
        });
        return false;
      }

      // Firebase crea el usuario con contraseña hasheada automáticamente
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // Crear perfil en Firestore
      const userProfile = await createUserProfile(userCredential.user.uid, {
        username: userData.username,
        email: userData.email,
        age: userData.age,
        phone: userData.phone,
      });

      setUser(userProfile);

      // Track registration (Analytics interno + GA4)
      trackUserRegister('email', { user: { id: userCredential.user.uid } });

      // Crear notificación de bienvenida
      createWelcomeNotification(userCredential.user.uid, userData.username);

      // Mostrar tour de bienvenida para nuevos usuarios
      setShowWelcomeTour(true);

      toast({
        title: "¡Cuenta creada! 🎉",
        description: "Bienvenido a Chactivo",
      });

      return true;
    } catch (error) {
      console.error('Register error:', error);

      let errorMessage = "Error al crear la cuenta";

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este email ya está registrado";
          break;
        case 'auth/invalid-email':
          errorMessage = "Email inválido";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña es muy débil";
          break;
        default:
          errorMessage = error.message;
      }

      toast({
        title: "Error al registrarse",
        description: errorMessage,
        variant: "destructive",
      });

      return false;
    }
  };

  /**
   * Iniciar sesión como invitado (guest)
   * ⚡ ULTRA OPTIMIZADO: <500ms total
   * ✅ Integrado con sistema de persistencia UUID
   */
  const signInAsGuest = async (username = null, avatarUrl = null, keepSession = false) => {
    // ✅ FIX: Prevenir múltiples llamadas simultáneas
    if (signInAsGuest.inProgress) {
      console.log('%c⚠️ [TIMING] signInAsGuest ya está en progreso, ignorando llamada duplicada', 'color: #ffaa00; font-weight: bold');
      return false;
    }

    signInAsGuest.inProgress = true;

    console.log('%c🚀 [TIMING] Iniciando proceso de entrada...', 'color: #00ff00; font-weight: bold; font-size: 14px');

    const startTime = performance.now();

    // ✅ FIX PERSISTENCIA: Reutilizar identidad existente si keepSession=true (auto-restore)
    const existingIdentity = getGuestIdentity();
    let identity;
    let finalUsername;
    let finalAvatar;

    if (keepSession && existingIdentity) {
      // Auto-restore: reutilizar identidad existente (mismo UUID, nombre, avatar)
      identity = existingIdentity;
      finalUsername = identity.nombre;
      finalAvatar = identity.avatar;
      console.log('⚡ [OPTIMISTIC] Identidad existente REUTILIZADA:', identity.guestId);
    } else {
      // Nueva entrada (modal/landing): crear identidad nueva
      const defaultUsername = username || `Guest${Math.floor(Math.random() * 10000)}`;
      const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest${Math.random()}`;
      identity = createGuestIdentity({
        nombre: defaultUsername,
        avatar: defaultAvatar
      });
      finalUsername = defaultUsername;
      finalAvatar = defaultAvatar;
      console.log('⚡ [OPTIMISTIC] Identidad NUEVA creada:', identity.guestId);
    }

    // ⚡ Crear usuario optimista INMEDIATAMENTE (sin esperar Firebase)
    const optimisticUser = {
      id: `temp_${identity.guestId}`, // ID temporal hasta que Firebase responda
      username: finalUsername,
      isGuest: true,
      isAnonymous: true,
      isPremium: false,
      verified: false,
      avatar: finalAvatar,
      quickPhrases: [],
      theme: {},
      guestId: identity.guestId,
    };

    // ⚡ SETEAR USUARIO INMEDIATAMENTE (sin esperar Firebase)
    setUser(optimisticUser);
    setGuestMessageCount(0);
    console.log('⚡ [OPTIMISTIC] Usuario seteado INMEDIATAMENTE para UI responsiva');

    // ⚡ Guardar datos temporales para que onAuthStateChanged actualice el ID real
    saveTempGuestData({
      nombre: finalUsername,
      avatar: finalAvatar,
      guestId: identity.guestId // Pasar el UUID para mantenerlo
    });

    // ✅ FIX PERSISTENCIA: Si ya hay sesión anónima activa, no crear nueva
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      console.log('⚡ [AUTH] Sesión anónima existente reutilizada:', auth.currentUser.uid);
      setUser({ ...optimisticUser, id: auth.currentUser.uid });

      // Vincular identidad con Firebase UID si no lo está
      if (identity.firebaseUid !== auth.currentUser.uid) {
        linkGuestToFirebase(auth.currentUser.uid);
      }

      signInAsGuest.inProgress = false;
      setGuestAuthInProgress(false);
      return true;
    }

    // 🚀 Firebase signInAnonymously solo si NO hay sesión activa
    const step1Start = performance.now();
    console.log('🔐 [AUTH] Iniciando signInAnonymously con username:', finalUsername);

      // 📊 PERFORMANCE MONITOR: Tracking de Firebase auth
    const perfMonitor = await import('@/utils/performanceMonitor');
    perfMonitor.startTiming('authStateChange', { type: 'signInAnonymously', username: finalUsername });

    try {
      // ⚡ NO usar timeout aquí - debe completar sin importar cuánto tarde
      // El usuario ya navega optimísticamente, esto se completa en background
      const userCredential = await signInAnonymously(auth);
      const step1Duration = performance.now() - step1Start;
      console.log(`⚡ [AUTH] signInAnonymously Firebase completado: ${step1Duration.toFixed(2)}ms`);
      console.log('%c✅ [AUTH] Firebase completado, onAuthStateChanged actualizará ID real', 'color: #00ff00; font-weight: bold');

      // 📊 PERFORMANCE MONITOR: Completar tracking
      perfMonitor.endTiming('authStateChange', { status: 'success', duration: step1Duration });

      // Esperar un breve momento para que onAuthStateChanged actualice el estado
      await new Promise(resolve => setTimeout(resolve, 100));

      const totalDuration = performance.now() - startTime;
      console.log(`⏱️ [TOTAL] Proceso completo: ${totalDuration.toFixed(2)}ms`);
      signInAsGuest.inProgress = false;
      setGuestAuthInProgress(false); // ✅ FASE 2: Desactivar loading overlay

      // 📊 PERFORMANCE MONITOR: Tracking completo de signInAsGuest
      perfMonitor.trackGuestAuth(startTime, {
        username: finalUsername,
        method: 'signInAnonymously',
        firebaseDuration: step1Duration,
        totalDuration
      });

      return true;
    } catch (error) {
      console.error('%c❌ [AUTH] Error en Firebase:', 'color: #ff0000; font-weight: bold', error);

      // 📊 PERFORMANCE MONITOR: Registrar error
      perfMonitor.endTiming('authStateChange', { status: 'error', error: error.message });
      perfMonitor.trackGuestAuth(startTime, {
        username: finalUsername,
        method: 'signInAnonymously',
        error: error.message,
        failed: true
      });

      signInAsGuest.inProgress = false;
      setGuestAuthInProgress(false); // ✅ FASE 2: Desactivar loading overlay incluso en error
      // El usuario optimista ya está seteado, pero Firebase falló
      throw error; // Propagar error para que el modal pueda manejarlo
    }
  };

  /**
   * Cerrar sesión
   * ✅ Integrado con sistema de persistencia UUID
   */
  const logout = async () => {
    try {
      // Marcar que estamos haciendo logout para evitar auto-login
      isLoggingOutRef.current = true;

      const wasGuest = user?.isGuest;

      // Limpiar estado inmediatamente
      setUser(null);
      setGuestMessageCount(0);

      // ✅ NUEVO SISTEMA: Limpiar identidad persistente
      if (wasGuest) {
        console.log('[AUTH] Limpiando identidad de invitado...');
        clearGuestIdentity(); // Limpia chactivo_guest_identity + temp + legacy
      }

      // Cerrar sesión en Firebase
      await signOut(auth);

      toast({
        title: "Sesión cerrada",
        description: "¡Hasta pronto! 👋",
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      isLoggingOutRef.current = false; // Resetear flag en caso de error
      toast({
        title: "Error",
        description: "No se pudo cerrar la sesión. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  /**
   * Actualizar perfil de usuario
   */
  const updateProfile = async (updates) => {
    if (!user || user.isGuest) return;

    try {
      await updateUserProfileService(user.id, updates);
      setUser({ ...user, ...updates });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    }
  };

  /**
   * Actualizar configuración de tema
   */
  const updateThemeSetting = async (setting, value) => {
    if (!user || user.isGuest) return;

    try {
      await updateUserThemeService(user.id, setting, value);
      setUser({
        ...user,
        theme: {
          ...user.theme,
          [setting]: value
        }
      });
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  /**
   * Añadir frase rápida
   */
  const addQuickPhrase = async (phrase) => {
    if (!user || user.isGuest) return;

    try {
      await addQuickPhraseService(user.id, phrase);
      setUser({
        ...user,
        quickPhrases: [...(user.quickPhrases || []), phrase]
      });
    } catch (error) {
      console.error('Error adding quick phrase:', error);
    }
  };

  /**
   * Eliminar frase rápida
   */
  const removeQuickPhrase = async (phraseToRemove) => {
    if (!user || user.isGuest) return;

    try {
      await removeQuickPhraseService(user.id, phraseToRemove);
      setUser({
        ...user,
        quickPhrases: (user.quickPhrases || []).filter(p => p !== phraseToRemove)
      });
    } catch (error) {
      console.error('Error removing quick phrase:', error);
    }
  };

  /**
   * Actualizar a Premium
   */
  const upgradeToPremium = async () => {
    if (!user || user.isGuest) return;

    try {
      await upgradeToPremiumService(user.id);
      setUser({ ...user, isPremium: true });

      toast({
        title: "¡Ahora eres Premium! 👑",
        description: "Disfruta de todas las funciones exclusivas",
      });
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar a Premium",
        variant: "destructive",
      });
    }
  };

  /**
   * Actualizar perfil de usuario anónimo (nombre y avatar)
   */
  const updateAnonymousUserProfile = async (username, avatarUrl) => {
    if (!user || !user.isAnonymous || !user.id) return;

    try {
      // Actualizar en Firestore
      const guestRef = doc(db, 'guests', user.id);
      await setDoc(guestRef, {
        username: username,
        avatar: avatarUrl,
        createdAt: new Date().toISOString(),
        messageCount: user.messageCount || 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      }, { merge: true });

      // Actualizar estado local
      setUser({
        ...user,
        username: username,
        avatar: avatarUrl,
      });

      return true;
    } catch (error) {
      console.error('Error updating anonymous user profile:', error);
      return false;
    }
  };

  /**
   * 🎭 Cambiar a identidad genérica (para admins)
   * Guarda la identidad original y cambia a un nombre/avatar genérico
   */
  const switchToGenericIdentity = () => {
    if (!user) return false;

    try {
      // Guardar identidad original si no existe
      const savedOriginal = localStorage.getItem('admin_original_identity');
      if (!savedOriginal) {
        localStorage.setItem('admin_original_identity', JSON.stringify({
          id: user.id,
          username: user.username,
          avatar: user.avatar,
          isPremium: user.isPremium,
          verified: user.verified,
          isAdmin: user.isAdmin,
          email: user.email,
          timestamp: Date.now(),
        }));
      }

      // Generar nombre genérico con número aleatorio
      const randomNum = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
      const genericUsername = `Usuario${randomNum}`;
      const genericAvatar = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=generic' + randomNum;

      // Aplicar identidad genérica
      setUser({
        ...user,
        username: genericUsername,
        avatar: genericAvatar,
        _isUsingGenericIdentity: true, // Flag interno
      });

      // Guardar en localStorage para persistencia
      localStorage.setItem('admin_generic_identity', JSON.stringify({
        username: genericUsername,
        avatar: genericAvatar,
        timestamp: Date.now(),
      }));

      console.log(`[ADMIN IDENTITY] 🎭 Cambiado a identidad genérica: ${genericUsername}`);

      toast({
        title: "🎭 Identidad Cambiada",
        description: `Ahora apareces como "${genericUsername}" en el chat`,
        duration: 4000,
      });

      return true;
    } catch (error) {
      console.error('[ADMIN IDENTITY] Error cambiando identidad:', error);
      return false;
    }
  };

  /**
   * 🛡️ Restaurar identidad original del admin
   */
  const restoreAdminIdentity = () => {
    if (!user) return false;

    try {
      const savedOriginal = localStorage.getItem('admin_original_identity');
      if (!savedOriginal) {
        console.warn('[ADMIN IDENTITY] No hay identidad original guardada');
        return false;
      }

      const originalData = JSON.parse(savedOriginal);

      // Restaurar identidad original
      setUser({
        ...user,
        username: originalData.username,
        avatar: originalData.avatar,
        _isUsingGenericIdentity: false,
      });

      // Limpiar localStorage
      localStorage.removeItem('admin_generic_identity');
      localStorage.removeItem('admin_original_identity');

      console.log(`[ADMIN IDENTITY] 🛡️ Restaurado a identidad admin: ${originalData.username}`);

      toast({
        title: "🛡️ Identidad Restaurada",
        description: `Has vuelto a ser "${originalData.username}"`,
        duration: 4000,
      });

      return true;
    } catch (error) {
      console.error('[ADMIN IDENTITY] Error restaurando identidad:', error);
      return false;
    }
  };

  // ✅ FASE 2: AUTO-RESTAURACIÓN de identidad persistente
  // Cuando el componente carga y NO hay usuario pero SÍ hay identidad guardada,
  // restaurar automáticamente la sesión sin mostrar modal (solo UNA vez para evitar loops)
  useEffect(() => {
    if (autoRestoreAttemptedRef.current) return;
    if (!loading && !user && !isLoggingOutRef.current && !guestAuthInProgress && hasGuestIdentity()) {
      autoRestoreAttemptedRef.current = true;
      console.log('[AUTH] 🔄 Auto-restaurando identidad persistente...');
      const identity = getGuestIdentity();
      if (identity) {
        signInAsGuest(identity.nombre, identity.avatar, true);
      }
    }
  }, [loading, user, guestAuthInProgress]);

  const value = useMemo(() => ({
    user,
    loading,
    guestMessageCount,
    setGuestMessageCount,
    showWelcomeTour,
    setShowWelcomeTour,
    guestAuthInProgress, // ✅ FASE 2: Estado de loading
    setGuestAuthInProgress, // ✅ FASE 2: Setter para controlar loading
    login,
    register,
    signInAsGuest,
    logout,
    updateProfile,
    upgradeToPremium,
    updateThemeSetting,
    addQuickPhrase,
    removeQuickPhrase,
    updateAnonymousUserProfile,
    switchToGenericIdentity,
    restoreAdminIdentity,
  }), [user, loading, guestMessageCount, showWelcomeTour, guestAuthInProgress]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
