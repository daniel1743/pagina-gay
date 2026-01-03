import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Escuchar cambios de autenticación de Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          if (firebaseUser.isAnonymous) {
            // Usuario anónimo - cargar datos desde Firestore
            const guestRef = doc(db, 'guests', firebaseUser.uid);
            const guestSnap = await getDoc(guestRef);

            let guestUser;

            if (guestSnap.exists()) {
              // Guest con datos personalizados
              const guestData = guestSnap.data();
              guestUser = {
                id: firebaseUser.uid,
                username: guestData.username || 'Invitado',
                isGuest: true,
                isAnonymous: true,
                isPremium: false,
                verified: false,
                avatar: guestData.avatar || 'https://api.dicebear.com/7.x/pixel-art/svg?seed=guest',
                quickPhrases: [],
                theme: {},
              };
              setGuestMessageCount(guestData.messageCount || 0);
            } else {
              // Guest sin datos (sesión anónima antigua)
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
            }

            setUser(guestUser);
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
          console.error('Error loading user profile:', error);
          // Si falla, intentar login anónimo
          signInAnonymously(auth).catch(err => {
            console.error('Error signing in anonymously:', err);
          });
        }
      } else {
        // No hay usuario - iniciar sesión anónima automáticamente
        signInAnonymously(auth).catch((error) => {
          console.error('Error en inicio de sesión anónimo:', error);
        });
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
   * Solo requiere username y avatar
   */
  const signInAsGuest = async (username, avatarUrl) => {
    try {
      // Crear usuario anónimo en Firebase
      const userCredential = await signInAnonymously(auth);

      // Guardar datos del guest en Firestore
      const guestData = {
        username: username,
        avatar: avatarUrl,
        createdAt: new Date().toISOString(),
        messageCount: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      };

      const guestRef = doc(db, 'guests', userCredential.user.uid);
      await setDoc(guestRef, guestData);

      // Actualizar estado del usuario
      const guestUser = {
        id: userCredential.user.uid,
        username: username,
        isGuest: true,
        isAnonymous: true,
        isPremium: false,
        verified: false,
        avatar: avatarUrl,
        quickPhrases: [],
        theme: {},
      };

      setUser(guestUser);
      setGuestMessageCount(0);

      return true;
    } catch (error) {
      console.error('Error signing in as guest:', error);
      throw error;
    }
  };

  /**
   * Cerrar sesión
   */
  const logout = async () => {
  try {
    // Simplemente cierra la sesión. El useEffect se encargará del resto.
    await signOut(auth);

    toast({
      title: "Sesión cerrada",
      description: "¡Hasta pronto! 👋",
    });
  } catch (error) {
    // ...
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

  const value = {
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
