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
import { trackUserRegister, trackUserLogin } from '@/services/analyticsService';
import { trackRegistration, trackLogin } from '@/services/ga4Service';
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

export const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const isLoggingOutRef = useRef(false); // Ref para evitar auto-login después de logout

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
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

              // Background: Sync con Firestore
              getDoc(doc(db, 'guests', firebaseUser.uid))
                .then(snap => {
                  if (snap.exists()) {
                    const guestData = snap.data();
                    setGuestMessageCount(guestData.messageCount || 0);
                  }
                })
                .catch(() => {});

              return;
            }

            // 🔒 PRIORIDAD 2: Datos temporales del modal (antes de crear identidad)
            if (tempData) {
              console.log('[AUTH] ✅ Datos temporales detectados, creando identidad...');

              const tempUsername = tempData.nombre || 'Invitado';
              const tempAvatar = tempData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest';

              // Crear identidad persistente con UUID
              const newIdentity = createGuestIdentity({
                nombre: tempUsername,
                avatar: tempAvatar
              });

              // Vincular con Firebase
              linkGuestToFirebase(firebaseUser.uid);

              console.log('[AUTH] ✅ Identidad creada con UUID:', newIdentity.guestId);

              // Crear usuario CON guestId en una sola operación
              guestUser = {
                id: firebaseUser.uid,
                username: tempUsername,
                isGuest: true,
                isAnonymous: true,
                isPremium: false,
                verified: false,
                avatar: tempAvatar,
                quickPhrases: [],
                theme: {},
                guestId: newIdentity.guestId, // ✅ UUID desde el inicio
              };

              setGuestMessageCount(0);
              setUser(guestUser); // ✅ UN SOLO setUser

              // 🚀 Guardar en Firestore EN BACKGROUND
              const guestRef = doc(db, 'guests', firebaseUser.uid);
              setDoc(guestRef, {
                username: tempUsername,
                avatar: tempAvatar,
                guestId: newIdentity.guestId,
                createdAt: new Date().toISOString(),
                messageCount: 0,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              })
              .then(() => {
                console.log('[AUTH] ✅ Firestore: Invitado guardado con UUID');
              })
              .catch((err) => {
                console.warn('[AUTH] ⚠️ Error guardando en Firestore (no crítico):', err);
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

            // 🚀 Intentar cargar de Firestore EN BACKGROUND (no bloquea)
            getDoc(doc(db, 'guests', firebaseUser.uid))
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
              .catch(() => {});
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

            setUser(userProfile);
            setGuestMessageCount(0); // Los usuarios registrados no tienen límite

            // Registrar conexión para sistema de verificación
            recordUserConnection(firebaseUser.uid);

            // Verificar mantenimiento de verificación
            checkVerificationMaintenance(firebaseUser.uid);
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
          }
        }
      } else {
        // No hay usuario - Limpiar estado
        console.log('[AUTH] ⚠️ firebaseUser es NULL, limpiando estado de usuario...');
        setUser(null);
        setGuestMessageCount(0);

        // Resetear el flag de logout si estaba activo
        if (isLoggingOutRef.current) {
          setTimeout(() => {
            isLoggingOutRef.current = false;
          }, 1000);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
      trackUserLogin(userCredential.user.uid, 'email');
      trackLogin({
        method: 'email',
        userId: userCredential.user.uid
      });

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
      trackUserRegister(userCredential.user.uid, 'email');
      trackRegistration({
        method: 'email',
        userId: userCredential.user.uid
      });

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
    const step1Start = performance.now();

    // ✅ Valores por defecto si no se proporcionan
    const defaultUsername = username || `Guest${Math.floor(Math.random() * 10000)}`;
    const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest${Math.random()}`;

    // ⚡ NUEVO SISTEMA: Guardar datos temporales para que onAuthStateChanged los encuentre
    saveTempGuestData({
      nombre: defaultUsername,
      avatar: defaultAvatar
    });

    try {
      // 🚀 PASO 1: Crear usuario anónimo en Firebase
      // ⚠️ CRÍTICO: onAuthStateChanged creará la identidad, NO lo hacemos aquí
      console.log('🔐 [AUTH] Iniciando signInAnonymously con username:', defaultUsername);
      const userCredential = await signInAnonymously(auth);
      const step1Duration = performance.now() - step1Start;
      console.log(`⏱️ [PASO 1] signInAnonymously Firebase: ${step1Duration.toFixed(2)}ms`);

      console.log('%c✅ [TIMING] Usuario autenticado - onAuthStateChanged creará identidad', 'color: #00ff00; font-weight: bold');

      // ⚠️ NO creamos identidad aquí - onAuthStateChanged lo hará al detectar tempData
      // ⚠️ NO llamamos setUser aquí - onAuthStateChanged lo hará
      // ⚠️ Firestore se guardará desde onAuthStateChanged en background

      const totalDuration = performance.now() - startTime;
      console.log(`⏱️ [TOTAL] signInAsGuest completado: ${totalDuration.toFixed(2)}ms`);
      signInAsGuest.inProgress = false;
      return true;
    } catch (error) {
      const totalDuration = performance.now() - startTime;
      console.log(`⏱️ [TOTAL] Proceso fallido después de: ${totalDuration.toFixed(2)}ms`);
      signInAsGuest.inProgress = false;
      console.error('%c❌ [TIMING] Error en entrada:', 'color: #ff0000; font-weight: bold', error);
      throw error;
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

  const value = useMemo(() => ({
    user,
    loading,
    guestMessageCount,
    setGuestMessageCount,
    showWelcomeTour,
    setShowWelcomeTour,
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
  }), [user, loading, guestMessageCount, showWelcomeTour]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
