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

const AuthContext = createContext();

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

            // ⚡ VELOCIDAD: localStorage PRIMERO (instantáneo)
            const backup = localStorage.getItem('guest_session_backup');
            const tempBackup = localStorage.getItem('guest_session_temp');

            if (backup) {
              try {
                const backupData = JSON.parse(backup);
                if (backupData.uid === firebaseUser.uid) {
                  guestUser = {
                    id: firebaseUser.uid,
                    username: backupData.username || 'Invitado',
                    isGuest: true,
                    isAnonymous: true,
                    isPremium: false,
                    verified: false,
                    avatar: backupData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
                    quickPhrases: [],
                    theme: {},
                  };
                  setGuestMessageCount(0);
                  setUser(guestUser);

                  // Background: Sync con Firestore
                  getDoc(doc(db, 'guests', firebaseUser.uid))
                    .then(snap => snap.exists() && setGuestMessageCount(snap.data().messageCount || 0))
                    .catch(() => {});

                  return;
                }
              } catch {}
            }

            if (tempBackup) {
              try {
                const tempData = JSON.parse(tempBackup);
                guestUser = {
                  id: firebaseUser.uid,
                  username: tempData.username || 'Invitado',
                  isGuest: true,
                  isAnonymous: true,
                  isPremium: false,
                  verified: false,
                  avatar: tempData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
                  quickPhrases: [],
                  theme: {},
                };
                setGuestMessageCount(0);
                setUser(guestUser);
                return;
              } catch {}
            }

            // ⚡ FALLBACK RÁPIDO: Crear usuario básico INMEDIATAMENTE (no esperar Firestore)
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
                  // Actualizar con datos reales si los hay
                  setUser({
                    id: firebaseUser.uid,
                    username: guestData.username || 'Invitado',
                    isGuest: true,
                    isAnonymous: true,
                    isPremium: false,
                    verified: false,
                    avatar: guestData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
                    quickPhrases: [],
                    theme: {},
                  });
                  setGuestMessageCount(guestData.messageCount || 0);
                  localStorage.setItem('guest_session_backup', JSON.stringify({
                    uid: firebaseUser.uid,
                    username: guestData.username,
                    avatar: guestData.avatar,
                    timestamp: Date.now(),
                  }));
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
        // No hay usuario - NO hacer auto-login anónimo (optimización de velocidad)
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
   */
  const signInAsGuest = async (username, avatarUrl) => {
    console.log('%c🚀 [TIMING] Iniciando proceso de entrada...', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.time('⏱️ [TOTAL] Entrada completa al chat');
    console.time('⏱️ [PASO 1] signInAnonymously Firebase');

    try {
      // ⚡ OPTIMISTIC UI: Crear usuario local PRIMERO (instantáneo)
      const tempUid = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const tempUser = {
        id: tempUid,
        username: username,
        isGuest: true,
        isAnonymous: true,
        isPremium: false,
        verified: false,
        avatar: avatarUrl || null,
        quickPhrases: [],
        theme: {},
      };

      // ⚡ ACTUALIZAR UI INMEDIATAMENTE (0ms)
      setUser(tempUser);
      setGuestMessageCount(0);

      // ⚡ Guardar backup temporal
      localStorage.setItem('guest_session_backup', JSON.stringify({
        uid: tempUid,
        username: username,
        avatar: avatarUrl,
        timestamp: Date.now(),
        isTemporary: true,
      }));

      console.log('%c✅ [TIMING] Usuario temporal creado - UI actualizada', 'color: #00ff00; font-weight: bold');

      // ⚡ PASO 1: Crear usuario anónimo en Firebase EN BACKGROUND (no bloquea)
      signInAnonymously(auth)
        .then((userCredential) => {
          console.timeEnd('⏱️ [PASO 1] signInAnonymously Firebase');
          
          // Actualizar con UID real
          const realUser = {
            ...tempUser,
            id: userCredential.user.uid,
          };
          setUser(realUser);

          // Actualizar backup con UID real
          localStorage.setItem('guest_session_backup', JSON.stringify({
            uid: userCredential.user.uid,
            username: username,
            avatar: avatarUrl,
            timestamp: Date.now(),
          }));

          console.log('%c✅ [TIMING] Usuario real creado en Firebase', 'color: #00ff00; font-weight: bold');

          // 🚀 TODO LO DEMÁS EN BACKGROUND (no bloquea)
          setTimeout(() => {
            console.time('⏱️ [BACKGROUND] Firestore setDoc');
            // Guardar en Firestore
            const guestRef = doc(db, 'guests', userCredential.user.uid);
            setDoc(guestRef, {
              username: username,
              avatar: avatarUrl,
              createdAt: new Date().toISOString(),
              messageCount: 0,
              expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .then(() => {
              console.timeEnd('⏱️ [BACKGROUND] Firestore setDoc');
              console.log('%c✅ [BACKGROUND] Datos guardados en Firestore', 'color: #888; font-style: italic');
            })
            .catch((err) => {
              console.warn('⚠️ [BACKGROUND] Error en Firestore (no crítico):', err);
            });
          }, 0);
        })
        .catch((error) => {
          console.error('%c❌ [TIMING] Error en Firebase (continuando con usuario temporal):', 'color: #ff0000; font-weight: bold', error);
          // Continuar con usuario temporal - el usuario ya está en el chat
        });

      // ⚡ RETORNAR INMEDIATAMENTE (no esperar Firebase)
      return true;
    } catch (error) {
      console.timeEnd('⏱️ [TOTAL] Entrada completa al chat');
      console.error('%c❌ [TIMING] Error en entrada:', 'color: #ff0000; font-weight: bold', error);
      throw error;
    }
  };

  /**
   * Cerrar sesión
   * ✅ ARREGLADO: Si es usuario invitado, NO limpiar localStorage para permitir re-login automático
   */
  const logout = async () => {
    try {
      // Marcar que estamos haciendo logout para evitar auto-login
      isLoggingOutRef.current = true;

      const wasGuest = user?.isGuest;

      // Limpiar estado inmediatamente
      setUser(null);
      setGuestMessageCount(0);

      // ⚠️ CRÍTICO: Solo limpiar localStorage si NO es invitado
      // Los invitados deben mantener su sesión para re-login automático
      if (!wasGuest) {
        localStorage.removeItem('guest_session_backup');
        localStorage.removeItem('guest_session_temp');
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
  }), [user, loading, guestMessageCount, showWelcomeTour]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
