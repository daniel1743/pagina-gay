import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';
import {
  signUpWithEmail,
  signInWithEmail,
  signInAnonymously,
  signOut as supabaseSignOut,
} from '@/services/supabaseAuthService';
import {
  ensureSupabaseProfile,
  getSupabaseProfile,
  mapSupabaseProfileToAppUser,
  updateSupabaseProfile,
  updateSupabasePreferences,
  getSupabasePrivateContact,
} from '@/services/supabaseProfileService';
import { toast } from '@/components/ui/use-toast';
import { hasValidGuestCommunityAccess } from '@/utils/communityPolicyGuard';
import { clearGuestIdentity } from '@/utils/guestIdentity';
import { normalizeComuna } from '@/config/comunas';
import { resolveProfileRole } from '@/config/profileRoles';

const toSafeErrorMessage = (error) => {
  const code = String(error?.code || '').toLowerCase();
  const message = String(error?.message || '').toLowerCase();
  if (code.includes('invalid') || message.includes('invalid login')) return 'Email o contraseña incorrectos.';
  if (code.includes('user_already_exists') || message.includes('already registered')) return 'Este email ya está registrado. Usa otro o inicia sesión.';
  if (code.includes('weak_password') || message.includes('password')) return 'La contraseña no cumple los requisitos mínimos.';
  if (code.includes('email_not_confirmed')) return 'Confirma tu email antes de iniciar sesión.';
  if (code.includes('rate')) return 'Demasiados intentos. Intenta nuevamente más tarde.';
  if (code.includes('network') || message.includes('fetch')) return 'No pudimos conectar con Supabase. Revisa tu conexión e inténtalo nuevamente.';
  return 'No se pudo completar la operación. Intenta nuevamente.';
};

const buildFallbackUser = (authUser, overrides = {}) => mapSupabaseProfileToAppUser(authUser, {
  id: authUser?.id,
  username: overrides.username || authUser?.user_metadata?.username,
  email: authUser?.email,
  avatar_url: overrides.avatar || authUser?.user_metadata?.avatar_url || null,
  profile_role: overrides.profileRole || authUser?.user_metadata?.profile_role,
  comuna: overrides.comuna || authUser?.user_metadata?.comuna,
  age: overrides.age || authUser?.user_metadata?.age || null,
  is_guest: Boolean(authUser?.is_anonymous),
});

export function SupabaseAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);
  const [guestMessageCount, setGuestMessageCount] = useState(0);
  const [guestAuthInProgress, setGuestAuthInProgress] = useState(false);
  const isLoggingOutRef = useRef(false);
  const mountedRef = useRef(true);

  const hydrateUser = useCallback(async (authUser, profileUpdates = {}) => {
    if (!authUser?.id) return null;
    try {
      const profile = await ensureSupabaseProfile(authUser, profileUpdates);
      let privateContact = null;
      if (!authUser.is_anonymous) {
        try {
          privateContact = await getSupabasePrivateContact(authUser.id);
        } catch {
          // La tabla privada puede añadirse después del primer corte; no bloquea el login.
        }
      }
      return mapSupabaseProfileToAppUser(authUser, { ...profile, phone: privateContact?.phone || null });
    } catch (error) {
      console.warn('[SUPABASE AUTH] No se pudo hidratar profiles; usando metadata segura:', error?.message || error);
      return buildFallbackUser(authUser, profileUpdates);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    if (!isSupabaseAuthEnabled() || !supabase?.auth) {
      setLoading(false);
      setAuthReady(false);
      return () => { mountedRef.current = false; };
    }

    const handleSession = (session) => {
      const authUser = session?.user || null;
      setAuthReady(Boolean(authUser?.id));
      if (!authUser) {
        setUser(null);
        setGuestMessageCount(0);
        setLoading(false);
        return;
      }

      setLoading(true);
      Promise.resolve()
        .then(() => hydrateUser(authUser))
        .then((nextUser) => {
          if (!mountedRef.current) return;
          setUser(nextUser);
          setGuestMessageCount(0);
          setLoading(false);
        })
        .catch((error) => {
          if (!mountedRef.current) return;
          console.warn('[SUPABASE AUTH] Error cargando sesión:', error?.message || error);
          setUser(buildFallbackUser(authUser));
          setLoading(false);
        });
    };

    const { data } = supabase.auth.onAuthStateChange((_event, session) => handleSession(session));
    return () => {
      mountedRef.current = false;
      data?.subscription?.unsubscribe?.();
    };
  }, [hydrateUser]);

  const login = useCallback(async (email, password) => {
    if (!isSupabaseAuthEnabled()) return false;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '');
    if (!normalizedEmail || !normalizedPassword) {
      toast({ title: 'Datos incompletos', description: 'Ingresa email y contraseña para continuar.', variant: 'destructive' });
      return false;
    }

    const result = await signInWithEmail(normalizedEmail, normalizedPassword);
    if (result.error || !result.user) {
      toast({ title: 'Error de autenticación', description: toSafeErrorMessage(result.error), variant: 'destructive' });
      return false;
    }

    const nextUser = await hydrateUser(result.user);
    if (nextUser) setUser(nextUser);
    toast({ title: 'Bienvenido de vuelta', description: nextUser?.username ? `Hola ${nextUser.username}` : 'Tu sesión está activa.' });
    return true;
  }, [hydrateUser]);

  const register = useCallback(async (userData = {}) => {
    if (!isSupabaseAuthEnabled()) return false;
    const email = String(userData.email || '').trim().toLowerCase();
    const password = String(userData.password || '');
    const age = Number.parseInt(userData.age, 10);
    const profileRole = resolveProfileRole(userData.profileRole, userData.role);
    if (!email || !password) {
      toast({ title: 'Datos incompletos', description: 'Ingresa email y contraseña.', variant: 'destructive' });
      return false;
    }
    if (!Number.isInteger(age) || age < 18 || age > 120) {
      toast({ title: 'Edad inválida', description: 'Debes ser mayor de 18 años para registrarte.', variant: 'destructive' });
      return false;
    }
    if (password.length < 6) {
      toast({ title: 'Contraseña débil', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
      return false;
    }
    if (!profileRole) {
      toast({ title: 'Rol requerido', description: 'Selecciona tu rol para registrarte.', variant: 'destructive' });
      return false;
    }

    const result = await signUpWithEmail(email, password, {
      username: String(userData.username || email.split('@')[0] || 'Usuario').trim().slice(0, 40),
      age,
      profile_role: profileRole,
      comuna: normalizeComuna(userData.comuna) || null,
      community_policy_accepted: Boolean(userData.communityPolicyAccepted),
      community_policy_version: userData.communityPolicyVersion || null,
    });

    if (result.error || !result.user) {
      toast({ title: 'Error al registrarse', description: toSafeErrorMessage(result.error), variant: 'destructive' });
      return false;
    }

    const nextUser = result.session
      ? await hydrateUser(result.user, {
          username: userData.username,
          age,
          profileRole,
          comuna: userData.comuna,
          communityPolicyAccepted: userData.communityPolicyAccepted,
          communityPolicyVersion: userData.communityPolicyVersion,
        })
      : null;
    if (nextUser) setUser(nextUser);
    toast({
      title: result.session ? 'Cuenta creada' : 'Revisa tu email',
      description: result.session ? 'Bienvenido a Chactivo.' : 'Confirma tu email para activar la cuenta.',
    });
    return Boolean(result.session);
  }, [hydrateUser]);

  const signInAsGuest = useCallback(async (username = null, avatarUrl = null, _keepSession = false, profileRoleRaw = null, comunaRaw = null) => {
    if (!isSupabaseAuthEnabled() || guestAuthInProgress) return false;
    const candidateUsername = String(username || '').trim();
    if (!hasValidGuestCommunityAccess({ username: candidateUsername || null })) {
      toast({ title: 'Acceso restringido', description: 'Debes confirmar que tienes 18 años o más y aceptar las normas.', variant: 'destructive' });
      return false;
    }
    setGuestAuthInProgress(true);
    const result = await signInAnonymously({
      username: candidateUsername || 'Invitado',
      avatar: avatarUrl || null,
      profile_role: resolveProfileRole(profileRoleRaw) || null,
      comuna: normalizeComuna(comunaRaw) || null,
    });
    setGuestAuthInProgress(false);
    if (result.error || !result.user) {
      toast({ title: 'No se pudo entrar como invitado', description: toSafeErrorMessage(result.error), variant: 'destructive' });
      return false;
    }
    const nextUser = await hydrateUser(result.user, {
      username: candidateUsername || 'Invitado',
      avatar: avatarUrl || null,
      profileRole: profileRoleRaw,
      comuna: comunaRaw,
    });
    setUser(nextUser);
    return true;
  }, [guestAuthInProgress, hydrateUser]);

  const logout = useCallback(async () => {
    isLoggingOutRef.current = true;
    const wasGuest = Boolean(user?.isGuest || user?.isAnonymous);
    setUser(null);
    setGuestMessageCount(0);
    if (wasGuest) clearGuestIdentity();
    const result = await supabaseSignOut();
    if (result.error) {
      isLoggingOutRef.current = false;
      toast({ title: 'Error', description: toSafeErrorMessage(result.error), variant: 'destructive' });
      return false;
    }
    toast({ title: 'Sesión cerrada', description: 'Hasta pronto.' });
    return true;
  }, [user]);

  const refreshProfile = useCallback(async () => {
    if (!user?.id || user.isGuest) return false;
    const authUser = (await supabase?.auth?.getUser())?.data?.user;
    if (!authUser) return false;
    const profile = await getSupabaseProfile(authUser.id);
    if (profile) setUser(mapSupabaseProfileToAppUser(authUser, profile));
    return Boolean(profile);
  }, [user]);

  const updateProfile = useCallback(async (updates = {}) => {
    if (!user?.id || user.isGuest || user.isAnonymous) return false;
    try {
      const nextUpdates = { ...updates };
      if (Object.prototype.hasOwnProperty.call(nextUpdates, 'comuna')) nextUpdates.comuna = normalizeComuna(nextUpdates.comuna) || null;
      const profile = await updateSupabaseProfile(user.id, nextUpdates);
      const authUser = (await supabase.auth.getUser()).data.user;
      setUser(mapSupabaseProfileToAppUser(authUser, profile));
      return true;
    } catch (error) {
      toast({ title: 'Error', description: toSafeErrorMessage(error), variant: 'destructive' });
      return false;
    }
  }, [user]);

  const updateThemeSetting = useCallback(async (setting, value) => {
    if (!user?.id || user.isGuest) return false;
    try {
      const theme = { ...(user.theme || {}), [setting]: value };
      await updateSupabasePreferences(user.id, { theme });
      setUser((prev) => ({ ...prev, theme }));
      return true;
    } catch (error) {
      console.warn('[SUPABASE AUTH] Error guardando tema:', error?.message || error);
      return false;
    }
  }, [user]);

  const addQuickPhrase = useCallback(async (phrase) => {
    if (!user?.id || user.isGuest) return false;
    const nextPhrases = [...new Set([...(user.quickPhrases || []), String(phrase || '').trim()].filter(Boolean))].slice(0, 20);
    await updateSupabasePreferences(user.id, { quickPhrases: nextPhrases });
    setUser((prev) => ({ ...prev, quickPhrases: nextPhrases }));
    return true;
  }, [user]);

  const removeQuickPhrase = useCallback(async (phrase) => {
    if (!user?.id || user.isGuest) return false;
    const nextPhrases = (user.quickPhrases || []).filter((item) => item !== phrase);
    await updateSupabasePreferences(user.id, { quickPhrases: nextPhrases });
    setUser((prev) => ({ ...prev, quickPhrases: nextPhrases }));
    return true;
  }, [user]);

  const updateAnonymousUserProfile = useCallback(async (username, avatarUrl) => {
    if (!user?.id || !user.isAnonymous) return false;
    try {
      const profile = await updateSupabaseProfile(user.id, { username, avatar: avatarUrl });
      const authUser = (await supabase.auth.getUser()).data.user;
      setUser(mapSupabaseProfileToAppUser(authUser, profile));
      return true;
    } catch {
      return false;
    }
  }, [user]);

  const switchToGenericIdentity = useCallback(() => {
    if (!user) return false;
    const original = { id: user.id, username: user.username, avatar: user.avatar };
    localStorage.setItem('admin_original_identity', JSON.stringify(original));
    const genericUsername = `Usuario${Math.floor(Math.random() * 9000) + 1000}`;
    setUser((prev) => ({ ...prev, username: genericUsername, avatar: null, _isUsingGenericIdentity: true }));
    return true;
  }, [user]);

  const restoreAdminIdentity = useCallback(() => {
    const stored = localStorage.getItem('admin_original_identity');
    if (!stored || !user) return false;
    try {
      const original = JSON.parse(stored);
      setUser((prev) => ({ ...prev, username: original.username, avatar: original.avatar, _isUsingGenericIdentity: false }));
      localStorage.removeItem('admin_original_identity');
      return true;
    } catch {
      return false;
    }
  }, [user]);

  const value = useMemo(() => ({
    user,
    loading,
    authReady,
    guestMessageCount,
    setGuestMessageCount,
    guestAuthInProgress,
    setGuestAuthInProgress,
    login,
    register,
    signInAsGuest,
    logout,
    updateProfile,
    refreshProfile,
    upgradeToPremium: async () => false,
    updateThemeSetting,
    addQuickPhrase,
    removeQuickPhrase,
    updateAnonymousUserProfile,
    switchToGenericIdentity,
    restoreAdminIdentity,
  }), [user, loading, authReady, guestMessageCount, guestAuthInProgress, login, register, signInAsGuest, logout, updateProfile, refreshProfile, updateThemeSetting, addQuickPhrase, removeQuickPhrase, updateAnonymousUserProfile, switchToGenericIdentity, restoreAdminIdentity]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
