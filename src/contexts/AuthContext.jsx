import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  linkWithCredential,
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
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { toast } from '@/components/ui/use-toast';
import { trackUserRegister, trackUserLogin } from '@/services/eventTrackingService';
import { recordUserConnection, checkVerificationMaintenance } from '@/services/verificationService';
import { checkUserSanctions } from '@/services/sanctionsService';
import { createWelcomeNotification } from '@/services/systemNotificationsService';
import { hasValidGuestCommunityAccess, syncGuestCommunityAccess } from '@/utils/communityPolicyGuard';
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
import { resolveProfileRole } from '@/config/profileRoles';
import { ONBOARDING_COMUNA_KEY, normalizeComuna } from '@/config/comunas';

// ⚡ Helper para agregar timeout a promesas de Firestore (evita delays de 41+ segundos)
const withTimeout = (promise, timeoutMs = 3000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firestore timeout')), timeoutMs)
    ),
  ]);
};

const maskDebugEmail = (email = '') => {
  const normalized = String(email || '').trim().toLowerCase();
  if (!normalized || !normalized.includes('@')) return normalized || '(empty)';
  const [localPart, domain] = normalized.split('@');
  const safeLocal = localPart.length <= 2
    ? `${localPart[0] || '*'}*`
    : `${localPart.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
};

const pushAuthDebugLog = (phase, payload = {}) => {
  const entry = {
    phase,
    at: new Date().toISOString(),
    ...payload,
  };

  console.log('[AUTH_DEBUG]', entry);

  if (typeof window !== 'undefined') {
    const previousLogs = Array.isArray(window.__chactivoAuthDebug)
      ? window.__chactivoAuthDebug
      : [];
    window.__chactivoAuthDebug = [...previousLogs.slice(-39), entry];
    window.__lastAuthDebug = entry;
  }

  return entry;
};

const diagnoseFirebaseAuthConnectivity = async () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) return { kind: 'missing_api_key' };

  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const body = JSON.stringify({
    email: 'diagnostic@chactivo.local',
    password: 'invalid_password_for_diagnostic',
    returnSecureToken: true,
  });

  try {
    pushAuthDebugLog('firebase_auth_diagnostic:start', {
      endpoint: 'identitytoolkit.googleapis.com',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const responseText = await response.text();

    if (
      response.status === 400 &&
      (
        responseText.includes('INVALID_LOGIN_CREDENTIALS') ||
        responseText.includes('EMAIL_NOT_FOUND') ||
        responseText.includes('INVALID_PASSWORD') ||
        responseText.includes('INVALID_EMAIL')
      )
    ) {
      pushAuthDebugLog('firebase_auth_diagnostic:reachable', {
        status: response.status,
      });
      return { kind: 'reachable' };
    }

    if (response.status === 403 && responseText.includes('API_KEY')) {
      pushAuthDebugLog('firebase_auth_diagnostic:api_key_restricted', {
        status: response.status,
      });
      return { kind: 'api_key_restricted' };
    }

    pushAuthDebugLog('firebase_auth_diagnostic:http_error', {
      status: response.status,
      snippet: responseText.slice(0, 120),
    });
    return {
      kind: 'http_error',
      status: response.status,
      snippet: responseText.slice(0, 180),
    };
  } catch (err) {
    pushAuthDebugLog('firebase_auth_diagnostic:network_error', {
      message: err?.message || String(err),
    });
    return { kind: 'network_error', message: err?.message || String(err) };
  }
};

// Diagnóstico amigable para errores de red en Firebase Auth.
const buildAuthNetworkErrorMessage = async () => {
  const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
  const emulatorRequested = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';
  const runtimeHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isRuntimeLocalhost = runtimeHostname === 'localhost' || runtimeHostname === '127.0.0.1';

  if (isOffline) {
    return "Sin conexión a internet. Revisa tu red e intenta de nuevo.";
  }

  if (emulatorRequested && !isRuntimeLocalhost) {
    return "Configuración inválida detectada (emulador activo fuera de localhost). Recarga la app actualizada.";
  }

  const diagnostic = await diagnoseFirebaseAuthConnectivity();
  const diagnosticJson = JSON.stringify(diagnostic);
  if (typeof window !== 'undefined') {
    window.__lastAuthNetworkDiagnostic = diagnostic;
  }
  console.warn('[AUTH] Diagnóstico network-request-failed (json):', diagnosticJson);

  if (diagnostic.kind === 'missing_api_key') {
    return "Falta configuración de Firebase API key en el build actual.";
  }
  if (diagnostic.kind === 'api_key_restricted') {
    return "La API key de Firebase está restringida para este dominio. Revisa restricciones en Google Cloud.";
  }
  if (diagnostic.kind === 'reachable') {
    return "Firebase responde, pero tu navegador está bloqueando la sesión (cache PWA vieja, VPN o bloqueador). Recarga forzada y reintenta.";
  }

  return "No pudimos conectar con Firebase Auth (red/DNS/VPN/AdBlock). Intenta en unos segundos o cambia de red.";
};

const buildInvalidCredentialHint = async (email) => {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    return "Email o contraseña incorrectos. Verifica tus datos e intenta nuevamente.";
  }

  try {
    const methods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
    if (Array.isArray(methods) && methods.includes('google.com') && !methods.includes('password')) {
      return "Esta cuenta fue creada con Google. Usa 'Continuar con Google' para iniciar sesión.";
    }
  } catch (error) {
    console.warn('[AUTH] No se pudo obtener hint de métodos de login:', error?.message || error);
  }

  return "Email o contraseña incorrectos. Verifica tus datos e intenta nuevamente.";
};

const persistGuestComuna = (comuna) => {
  if (typeof window === 'undefined') return;
  const normalizedComuna = normalizeComuna(comuna);
  if (normalizedComuna) {
    localStorage.setItem(ONBOARDING_COMUNA_KEY, normalizedComuna);
    return;
  }
  localStorage.removeItem(ONBOARDING_COMUNA_KEY);
};

const isInvalidCredentialNetworkMask = (error) => {
  const message = String(error?.message || '').toUpperCase();
  const serverMessage = String(
    error?.customData?._serverResponse ||
    error?.customData?._tokenResponse?.error?.message ||
    ''
  ).toUpperCase();

  return (
    message.includes('INVALID_LOGIN_CREDENTIALS') ||
    message.includes('INVALID_PASSWORD') ||
    message.includes('EMAIL_NOT_FOUND') ||
    serverMessage.includes('INVALID_LOGIN_CREDENTIALS') ||
    serverMessage.includes('INVALID_PASSWORD') ||
    serverMessage.includes('EMAIL_NOT_FOUND')
  );
};

// Valor por defecto para evitar crash durante ErrorBoundary recovery o StrictMode remount
// Cuando el Provider está desmontado brevemente, los componentes reciben este fallback
const DEFAULT_AUTH_CONTEXT = {
  user: null,
  loading: true,
  authReady: false,
  guestMessageCount: 0,
  setGuestMessageCount: () => {},
  guestAuthInProgress: false,
  setGuestAuthInProgress: () => {},
  login: async () => {},
  register: async () => {},
  signInAsGuest: async () => false,
  logout: async () => {},
  updateProfile: async () => {},
  refreshProfile: async () => {},
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
  const [authReady, setAuthReady] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
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
      setAuthReady(Boolean(firebaseUser?.uid));
      
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
              const normalizedGuestRole = resolveProfileRole(identity.profileRole);
              const normalizedGuestComuna = normalizeComuna(identity.comuna);

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
                profileRole: normalizedGuestRole || null,
                comuna: normalizedGuestComuna || null,
              };

              if (normalizedGuestRole && typeof window !== 'undefined') {
                localStorage.setItem('chactivo:role', normalizedGuestRole);
              }
              persistGuestComuna(normalizedGuestComuna);

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
              const normalizedGuestRole = resolveProfileRole(tempData.role);
              const normalizedGuestComuna = normalizeComuna(tempData.comuna);

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
                profileRole: normalizedGuestRole || null,
                comuna: normalizedGuestComuna || null,
              };

              if (normalizedGuestRole && typeof window !== 'undefined') {
                localStorage.setItem('chactivo:role', normalizedGuestRole);
              }
              persistGuestComuna(normalizedGuestComuna);

              setGuestMessageCount(0);
              setUser(guestUser); // ✅ Actualizar con ID real
              setLoading(false); // ✅ FIX: Asegurar que loading se actualice

              // 🚀 Guardar en Firestore EN BACKGROUND (con timeout de 3 segundos)
              const guestRef = doc(db, 'guests', firebaseUser.uid);
              withTimeout(setDoc(guestRef, {
                username: tempUsername,
                avatar: tempAvatar,
                guestId: existingGuestId, // ✅ UUID ya creado
                profileRole: normalizedGuestRole || null,
                comuna: normalizedGuestComuna || null,
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
              comuna: normalizeComuna(typeof window !== 'undefined' ? localStorage.getItem(ONBOARDING_COMUNA_KEY) : ''),
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
                      comuna: normalizeComuna(guestData.comuna),
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
            const normalizedProfileRole = resolveProfileRole(userProfile?.profileRole);
            if (normalizedProfileRole && typeof window !== 'undefined') {
              localStorage.setItem('chactivo:role', normalizedProfileRole);
            }
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

  // ✅ BAÚL: Crear tarjeta automática solo para usuarios REGISTRADOS con auth lista
  useEffect(() => {
    if (!authReady || !user?.id) return;
    if (user.isGuest || user.isAnonymous) return;
    if (!auth.currentUser?.uid || auth.currentUser.uid !== user.id) return;

    const crearTarjetaSiNoExiste = async () => {
      try {
        console.log('[AUTH/BAUL] 📋 Verificando/creando tarjeta para:', user.username, user.id);

        await crearTarjetaAutomatica({
          odIdUsuari: user.id,
          username: user.username || 'Usuario',
          esInvitado: user.isGuest || user.isAnonymous || false,
          edad: user.edad || null,
          avatar: user.avatar || null,
          isProUser: user.isProUser || false,
          proUntil: user.proUntil || null,
          canUploadSecondPhoto: user.canUploadSecondPhoto || false,
          hasFeaturedCard: user.hasFeaturedCard || false,
          hasRainbowBorder: user.hasRainbowBorder || false,
          hasProBadge: user.hasProBadge || false
        });

        console.log('[AUTH/BAUL] ✅ Tarjeta verificada/creada para:', user.username);
      } catch (error) {
        console.error('[AUTH/BAUL] Error creando tarjeta:', error);
      }
    };

    // Ejecutar en background, no bloquear la UI
    crearTarjetaSiNoExiste();
  }, [
    authReady,
    user?.id,
    user?.isGuest,
    user?.isAnonymous,
    user?.isProUser,
    user?.proUntil,
    user?.canUploadSecondPhoto,
    user?.hasFeaturedCard,
    user?.hasRainbowBorder,
    user?.hasProBadge
  ]);

  // 🔄 Sincronizar perfil en tiempo real (premios PRO, verificación, premium, etc.)
  useEffect(() => {
    if (!user?.id || user.isGuest || user.isAnonymous) return () => {};

    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (!snap.exists()) return;
      const latest = snap.data() || {};

      setUser((prev) => {
        if (!prev || prev.id !== user.id) return prev;
        // Si admin usa identidad genérica temporal, no sobreescribir su máscara local
        if (prev._isUsingGenericIdentity) return prev;
        return {
          ...prev,
          ...latest,
          id: user.id,
        };
      });
    }, (error) => {
      console.warn('[AUTH] Error sincronizando perfil en tiempo real:', error?.message);
    });

    return () => unsubscribe();
  }, [user?.id, user?.isGuest, user?.isAnonymous]);

  /**
   * Inicio de sesión con email y contraseña
   * ✅ Firebase hashea automáticamente las contraseñas (bcrypt)
   * ✅ Validación del lado del servidor
   */
  const login = async (email, password) => {
    try {
      const normalizedEmail = String(email || '').trim().toLowerCase();
      const normalizedPassword = String(password || '');

      if (!normalizedEmail || !normalizedPassword) {
        toast({
          title: "Datos incompletos",
          description: "Ingresa email y contraseña para continuar.",
          variant: "destructive",
        });
        return false;
      }

      // Firebase maneja el hash y validación de contraseña automáticamente
      const userCredential = await signInWithEmailAndPassword(auth, normalizedEmail, normalizedPassword);

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
          errorMessage = await buildInvalidCredentialHint(email);
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
        case 'auth/network-request-failed':
          errorMessage = isInvalidCredentialNetworkMask(error)
            ? await buildInvalidCredentialHint(email)
            : await buildAuthNetworkErrorMessage();
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
      // Validaciones básicas del lado del cliente (solo edad, email, contraseña)
      if (!userData.email || !userData.password) {
        toast({
          title: "Datos incompletos",
          description: "Ingresa email y contraseña",
          variant: "destructive",
        });
        return false;
      }

      const ageNum = userData.age ? parseInt(userData.age) : 0;
      if (isNaN(ageNum) || ageNum < 18) {
        toast({
          title: "Edad insuficiente",
          description: "Debes ser mayor de 18 años para registrarte",
          variant: "destructive",
        });
        return false;
      }
      if (ageNum > 120) {
        toast({
          title: "Edad inválida",
          description: "Ingresa una edad válida",
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
      const normalizedProfileRole = resolveProfileRole(userData.profileRole, userData.role);
      if (!normalizedProfileRole) {
        toast({
          title: "Rol requerido",
          description: "Selecciona tu rol para registrarte",
          variant: "destructive",
        });
        return false;
      }

      // Username auto-generado desde email si no se proporciona (reduce fricción)
      const base = (userData.email || '').split('@')[0] || '';
      const sanitized = base.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 18) || `Usuario_${Math.random().toString(36).slice(2, 8)}`;
      const username = userData.username?.trim() || sanitized;

      const existingGuestUser = auth.currentUser?.isAnonymous ? auth.currentUser : null;
      const guestSnapshot = existingGuestUser && user?.id === existingGuestUser.uid
        ? user
        : null;

      let userCredential;
      if (existingGuestUser) {
        const credential = EmailAuthProvider.credential(userData.email, userData.password);
        userCredential = await linkWithCredential(existingGuestUser, credential);
      } else {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          userData.email,
          userData.password
        );
      }

      // Crear perfil en Firestore
      const userProfile = await createUserProfile(userCredential.user.uid, {
        username: guestSnapshot?.username || username,
        email: userData.email,
        age: userData.age,
        phone: userData.phone || null,
        profileRole: normalizedProfileRole,
        comuna: guestSnapshot?.comuna || null,
        avatar: guestSnapshot?.avatar || null,
        communityPolicyAccepted: Boolean(userData.communityPolicyAccepted),
        communityPolicyAcceptedAt: userData.communityPolicyAcceptedAt || Date.now(),
        communityPolicyVersion: userData.communityPolicyVersion || null,
      });

      setUser(userProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('chactivo:role', normalizedProfileRole);
      }

      // Track registration (Analytics interno + GA4)
      trackUserRegister('email', { user: { id: userCredential.user.uid } });

      // Crear notificación de bienvenida
      createWelcomeNotification(userCredential.user.uid, username);

      toast({
        title: "¡Cuenta creada! 🎉",
        description: "Bienvenido a Chactivo",
      });

      return true;
    } catch (error) {
      console.error('Register error:', error?.code, error?.message, error);

      let errorMessage = "Error al crear la cuenta";

      switch (error?.code) {
        case 'auth/email-already-in-use':
          errorMessage = "Este email ya está registrado. Usa otro o inicia sesión.";
          break;
        case 'auth/invalid-email':
          errorMessage = "El formato del email no es válido.";
          break;
        case 'auth/weak-password':
          errorMessage = "La contraseña debe tener al menos 6 caracteres.";
          break;
        case 'auth/operation-not-allowed':
          errorMessage = "Registro por email deshabilitado. Contacta al administrador.";
          break;
        case 'auth/invalid-api-key':
          errorMessage = "Error de configuración. Contacta al administrador.";
          break;
        case 'auth/network-request-failed':
          errorMessage = await buildAuthNetworkErrorMessage();
          break;
        default:
          errorMessage = error?.message || errorMessage;
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
  const signInAsGuest = async (username = null, avatarUrl = null, keepSession = false, profileRoleRaw = null, comunaRaw = null) => {
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
    const requestedRole = resolveProfileRole(profileRoleRaw);
    const requestedComuna = normalizeComuna(comunaRaw);
    let finalProfileRole = requestedRole;
    let finalComuna = requestedComuna;

    const candidateUsername = String(username || existingIdentity?.nombre || '').trim();
    const canEnterAsGuest = hasValidGuestCommunityAccess({
      username: candidateUsername || null,
    });

    if (!canEnterAsGuest) {
      toast({
        title: "Acceso restringido",
        description: "Debes confirmar que tienes 18 años o más y aceptar las normas antes de entrar como invitado.",
        variant: "destructive",
      });
      signInAsGuest.inProgress = false;
      setGuestAuthInProgress(false);
      return false;
    }

    if (keepSession && existingIdentity) {
      // Auto-restore: reutilizar identidad existente (mismo UUID, nombre, avatar)
      identity = existingIdentity;
      finalUsername = identity.nombre;
      finalAvatar = identity.avatar;
      finalProfileRole = resolveProfileRole(requestedRole, identity.profileRole);
      finalComuna = normalizeComuna(requestedComuna || identity.comuna);
      console.log('⚡ [OPTIMISTIC] Identidad existente REUTILIZADA:', identity.guestId);
    } else {
      // Nueva entrada (modal/landing): crear identidad nueva
      const defaultUsername = username || `Guest${Math.floor(Math.random() * 10000)}`;
      const defaultAvatar = avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=Guest${Math.random()}`;
      finalComuna = normalizeComuna(requestedComuna || (typeof window !== 'undefined' ? localStorage.getItem(ONBOARDING_COMUNA_KEY) : ''));
      identity = createGuestIdentity({
        nombre: defaultUsername,
        avatar: defaultAvatar,
        profileRole: finalProfileRole || null,
        comuna: finalComuna || null,
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
      profileRole: finalProfileRole || null,
      comuna: finalComuna || null,
    };

    if (finalProfileRole && typeof window !== 'undefined') {
      localStorage.setItem('chactivo:role', finalProfileRole);
    }
    persistGuestComuna(finalComuna);

    // ⚡ SETEAR USUARIO INMEDIATAMENTE (sin esperar Firebase)
    setUser(optimisticUser);
    setGuestMessageCount(0);
    console.log('⚡ [OPTIMISTIC] Usuario seteado INMEDIATAMENTE para UI responsiva');

    // ⚡ Guardar datos temporales para que onAuthStateChanged actualice el ID real
    saveTempGuestData({
      nombre: finalUsername,
      avatar: finalAvatar,
      guestId: identity.guestId, // Pasar el UUID para mantenerlo
      role: finalProfileRole || null,
      comuna: finalComuna || null,
    });

    // ✅ FIX PERSISTENCIA: Si ya hay sesión anónima activa, no crear nueva
    if (auth.currentUser && auth.currentUser.isAnonymous) {
      console.log('⚡ [AUTH] Sesión anónima existente reutilizada:', auth.currentUser.uid);
      setUser({ ...optimisticUser, id: auth.currentUser.uid });
      syncGuestCommunityAccess({ userId: auth.currentUser.uid, username: finalUsername });

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

      syncGuestCommunityAccess({ userId: userCredential.user.uid, username: finalUsername });

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
   * Refrescar perfil desde Firestore (útil cuando cambia por recompensas/otros)
   */
  const refreshProfile = async () => {
    if (!auth.currentUser?.uid || user?.isGuest || user?.isAnonymous) return;
    try {
      const fresh = await getUserProfile(auth.currentUser.uid);
      if (fresh) {
        setUser((prev) => (prev?.id === fresh.id ? { ...prev, ...fresh } : prev));
      }
    } catch (err) {
      console.warn('[AUTH] Error refreshProfile:', err?.message);
    }
  };

  /**
   * Actualizar perfil de usuario
   */
  const updateProfile = async (updates) => {
    if (!user || user.isGuest) return false;

    try {
      const nextUpdates = { ...updates };
      if (Object.prototype.hasOwnProperty.call(nextUpdates, 'comuna')) {
        nextUpdates.comuna = normalizeComuna(nextUpdates.comuna) || null;
        persistGuestComuna(nextUpdates.comuna);
      }

      await updateUserProfileService(user.id, nextUpdates);
      setUser({ ...user, ...nextUpdates });
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
      return false;
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
      if (identity && hasValidGuestCommunityAccess({ username: identity.nombre })) {
        signInAsGuest(identity.nombre, identity.avatar, true, identity.profileRole || null, identity.comuna || null);
      }
    }
  }, [loading, user, guestAuthInProgress]);

  const value = useMemo(() => ({
    user,
    loading,
    authReady,
    guestMessageCount,
    setGuestMessageCount,
    guestAuthInProgress, // ✅ FASE 2: Estado de loading
    setGuestAuthInProgress, // ✅ FASE 2: Setter para controlar loading
    login,
    register,
    signInAsGuest,
    logout,
    updateProfile,
    refreshProfile,
    upgradeToPremium,
    updateThemeSetting,
    addQuickPhrase,
    removeQuickPhrase,
    updateAnonymousUserProfile,
    switchToGenericIdentity,
    restoreAdminIdentity,
  }), [user, loading, authReady, guestMessageCount, guestAuthInProgress]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
