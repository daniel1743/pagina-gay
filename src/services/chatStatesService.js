import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth } from '@/config/firebase';
import { resolveProfileRole } from '@/config/profileRoles';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';

const STATE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_FETCH_LIMIT = 60;
const MAX_NO_PHOTO_STATES = 3;
const ALLOWED_STATE_REACTIONS = ['fire', 'spark', 'eyes', 'heart', 'crown'];

const GENERIC_AVATAR_PATTERNS = [
  'dicebear.com',
  'ui-avatars.com',
  'gravatar.com/avatar',
  '/avatar_por_defecto',
  'default-avatar',
  'default_avatar',
  'no-avatar',
  'no_avatar',
  'blank-profile',
  'blank_profile',
];

const toMillisSafe = (value) => {
  if (!value) return null;
  if (typeof value?.toMillis === 'function') return value.toMillis();
  if (typeof value?.seconds === 'number') return value.seconds * 1000;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return null;
};

const getStatesCollectionRef = (roomId) => collection(db, 'rooms', roomId, 'states');
const getStateDocRef = (roomId, userId) => doc(db, 'rooms', roomId, 'states', userId);
const getUserDocRef = (userId) => doc(db, 'users', userId);
const getStateReactionsCollectionRef = (roomId, stateUserId) =>
  collection(db, 'rooms', roomId, 'states', stateUserId, 'reactions');
const getStateReactionDocRef = (roomId, stateUserId, reactionUserId) =>
  doc(db, 'rooms', roomId, 'states', stateUserId, 'reactions', reactionUserId);

const hasRealProfilePhoto = (avatarUrl) => {
  const safeUrl = String(avatarUrl || '').trim().toLowerCase();
  if (!safeUrl) return false;
  if (GENERIC_AVATAR_PATTERNS.some((pattern) => safeUrl.includes(pattern))) return false;
  return true;
};

const normalizeState = (snap) => {
  const data = snap.data() || {};
  const createdAtMs = toMillisSafe(data.createdAt);
  const updatedAtMs = toMillisSafe(data.updatedAt);
  const expiresAtMs = toMillisSafe(data.expiresAt);

  return {
    id: snap.id,
    userId: data.userId || snap.id,
    username: data.username || 'Usuario',
    avatar: data.avatar || '/avatar_por_defecto.jpeg',
    roleBadge: data.roleBadge || null,
    message: String(data.message || ''),
    createdAtMs,
    updatedAtMs,
    expiresAtMs,
    createdAtISO: createdAtMs ? new Date(createdAtMs).toISOString() : null,
  };
};

const isActiveState = (item) => {
  const now = Date.now();
  if (!item?.message) return false;
  if (item.expiresAtMs && item.expiresAtMs < now) return false;
  if (!item.createdAtMs) return true;
  return (now - item.createdAtMs) <= STATE_TTL_MS;
};

export const fetchRoomStates = async (roomId, maxItems = DEFAULT_FETCH_LIMIT) => {
  if (!roomId) return [];

  if (isSupabaseAuthEnabled()) {
    const safeLimit = Math.max(1, Math.min(Number(maxItems) || DEFAULT_FETCH_LIMIT, 100));
    const { data: rows, error } = await supabase.from('room_states').select('*').eq('room_id', roomId).gt('expires_at', new Date().toISOString()).order('updated_at', { ascending: false }).limit(safeLimit);
    if (error) throw error;
    const ids = [...new Set((rows || []).map((row) => row.author_id).filter(Boolean))];
    const { data: profiles, error: profileError } = ids.length ? await supabase.from('profiles').select('id, username, avatar_url, profile_role').in('id', ids) : { data: [], error: null };
    if (profileError) throw profileError;
    const profilesById = new Map((profiles || []).map((profile) => [profile.id, profile]));
    return (rows || []).map((row) => normalizeState({ id: row.id, data: () => ({ userId: row.author_id, username: profilesById.get(row.author_id)?.username, avatar: profilesById.get(row.author_id)?.avatar_url, roleBadge: row.role_badge || profilesById.get(row.author_id)?.profile_role, message: row.message, createdAt: row.created_at, updatedAt: row.updated_at, expiresAt: row.expires_at }) })).filter(isActiveState);
  }

  const statesRef = getStatesCollectionRef(roomId);
  const q = query(statesRef, orderBy('updatedAt', 'desc'), limit(maxItems));
  const snapshot = await getDocs(q);

  const items = snapshot.docs
    .map(normalizeState)
    .filter(isActiveState);

  return items;
};

export const getOwnStateCooldown = async (roomId, userId) => {
  if (isSupabaseAuthEnabled()) {
    if (!roomId || !userId) return { canPublish: false, remainingMs: STATE_TTL_MS };
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.id !== userId) throw new Error('state/auth-required');
    const { data, error } = await supabase.from('room_states').select('*').eq('room_id', roomId).eq('author_id', userId).maybeSingle();
    if (error) throw error;
    if (!data) return { canPublish: true, remainingMs: 0 };
    const ownState = normalizeState({ id: data.id, data: () => ({ userId: data.author_id, message: data.message, createdAt: data.created_at, updatedAt: data.updated_at, expiresAt: data.expires_at }) });
    const createdAtMs = ownState.createdAtMs;
    if (!createdAtMs) return { canPublish: false, remainingMs: STATE_TTL_MS };
    const remainingMs = Math.max(0, STATE_TTL_MS - (Date.now() - createdAtMs));
    return { canPublish: remainingMs === 0, remainingMs, state: ownState };
  }
  if (!roomId || !userId) {
    return { canPublish: false, remainingMs: STATE_TTL_MS };
  }

  const ownRef = getStateDocRef(roomId, userId);
  const ownSnap = await getDoc(ownRef);
  if (!ownSnap.exists()) {
    return { canPublish: true, remainingMs: 0 };
  }

  const ownState = normalizeState(ownSnap);
  const createdAtMs = ownState.createdAtMs;
  if (!createdAtMs) {
    return { canPublish: false, remainingMs: STATE_TTL_MS };
  }

  const elapsed = Date.now() - createdAtMs;
  const remainingMs = Math.max(0, STATE_TTL_MS - elapsed);

  return {
    canPublish: remainingMs === 0,
    remainingMs,
    state: ownState,
  };
};

export const publishRoomState = async (roomId, stateData) => {
  if (isSupabaseAuthEnabled()) {
    if (!roomId) throw new Error('state/invalid-room');
    const { data: authData } = await supabase.auth.getUser();
    const activeUser = authData?.user;
    if (!activeUser?.id) throw new Error('state/auth-required');
    if (activeUser.is_anonymous || stateData?.isGuest || stateData?.isAnonymous) throw new Error('state/registered-only');
    const text = String(stateData?.message || '').trim();
    if (!text) throw new Error('state/empty-message');
    if (text.length > 160) throw new Error('state/message-too-long');
    const { data: profile, error: profileError } = await supabase.from('profiles').select('avatar_url, profile_role, username, is_guest').eq('id', activeUser.id).single();
    if (profileError) throw profileError;
    const hasRealPhoto = hasRealProfilePhoto(profile?.avatar_url || stateData?.avatar);
    const { count, error: countError } = await supabase.from('room_states').select('id', { count: 'exact', head: true }).eq('author_id', activeUser.id).gte('created_at', new Date(Date.now() - STATE_TTL_MS).toISOString());
    if (countError) throw countError;
    if (!hasRealPhoto && Number(count || 0) >= MAX_NO_PHOTO_STATES) { const error = new Error('state/photo-required'); error.requiredAfter = MAX_NO_PHOTO_STATES; throw error; }
    const cooldown = await getOwnStateCooldown(roomId, activeUser.id);
    if (!cooldown.canPublish) { const error = new Error('state/cooldown'); error.remainingMs = cooldown.remainingMs || STATE_TTL_MS; throw error; }
    const roleBadge = resolveProfileRole(stateData?.roleBadge, stateData?.profileRole, stateData?.role) || profile?.profile_role || null;
    const { error } = await supabase.from('room_states').upsert({ room_id: roomId, author_id: activeUser.id, role_badge: roleBadge, message: text, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), expires_at: new Date(Date.now() + STATE_TTL_MS).toISOString() }, { onConflict: 'room_id,author_id' });
    if (error) throw error;
    return { ok: true };
  }
  if (!roomId) throw new Error('state/invalid-room');
  if (!auth.currentUser?.uid) throw new Error('state/auth-required');
  if (auth.currentUser.isAnonymous || stateData?.isGuest || stateData?.isAnonymous) {
    throw new Error('state/registered-only');
  }

  const userId = auth.currentUser.uid;
  const text = String(stateData?.message || '').trim();
  if (!text) throw new Error('state/empty-message');
  if (text.length > 160) throw new Error('state/message-too-long');

  const hasRealPhoto = hasRealProfilePhoto(stateData?.avatar);
  const userRef = getUserDocRef(userId);
  const userSnap = await getDoc(userRef);
  const noPhotoStatesCount = Number(userSnap.data()?.statesNoPhotoCount || 0);

  if (!hasRealPhoto && noPhotoStatesCount >= MAX_NO_PHOTO_STATES) {
    const profilePhotoError = new Error('state/photo-required');
    profilePhotoError.requiredAfter = MAX_NO_PHOTO_STATES;
    throw profilePhotoError;
  }

  const cooldown = await getOwnStateCooldown(roomId, userId);
  if (!cooldown.canPublish) {
    const cooldownError = new Error('state/cooldown');
    cooldownError.remainingMs = cooldown.remainingMs || STATE_TTL_MS;
    throw cooldownError;
  }

  const roleBadge = resolveProfileRole(
    stateData?.roleBadge,
    stateData?.profileRole,
    stateData?.role
  );

  const ownRef = getStateDocRef(roomId, userId);
  await setDoc(ownRef, {
    userId,
    username: stateData?.username || 'Usuario',
    avatar: stateData?.avatar || '/avatar_por_defecto.jpeg',
    roleBadge: roleBadge || null,
    message: text,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    expiresAt: new Date(Date.now() + STATE_TTL_MS),
  }, { merge: true });

  if (userSnap.exists()) {
    await setDoc(userRef, {
      statesNoPhotoCount: hasRealPhoto ? 0 : noPhotoStatesCount + 1,
      statesNoPhotoLastAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  return { ok: true };
};

export const deleteRoomState = async (roomId, targetUserId = null) => {
  if (isSupabaseAuthEnabled()) {
    if (!roomId) throw new Error('state/invalid-room');
    const { data: authData } = await supabase.auth.getUser();
    const ownerId = targetUserId || authData?.user?.id;
    if (!authData?.user?.id || ownerId !== authData.user.id) throw new Error('state/not-owner');
    const { error } = await supabase.from('room_states').delete().eq('room_id', roomId).eq('author_id', ownerId);
    if (error) throw error;
    return { ok: true };
  }
  if (!roomId) throw new Error('state/invalid-room');
  if (!auth.currentUser?.uid) throw new Error('state/auth-required');

  const ownerId = targetUserId || auth.currentUser.uid;
  if (ownerId !== auth.currentUser.uid) throw new Error('state/not-owner');

  await deleteDoc(getStateDocRef(roomId, ownerId));
  return { ok: true };
};

export const fetchStateReactions = async (roomId, stateUserId) => {
  if (!roomId || !stateUserId) return [];
  if (isSupabaseAuthEnabled()) {
    const { data: state, error: stateError } = await supabase.from('room_states').select('id').eq('room_id', roomId).eq('author_id', stateUserId).maybeSingle();
    if (stateError) throw stateError;
    if (!state) return [];
    const { data: rows, error } = await supabase.from('room_state_reactions').select('user_id, reaction, updated_at').eq('room_state_id', state.id).order('updated_at', { ascending: false }).limit(200);
    if (error) throw error;
    const ids = [...new Set((rows || []).map((row) => row.user_id).filter(Boolean))];
    const { data: profiles, error: profileError } = ids.length ? await supabase.from('profiles').select('id, username, avatar_url').in('id', ids) : { data: [], error: null };
    if (profileError) throw profileError;
    const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
    return (rows || []).map((row) => ({ id: row.user_id, userId: row.user_id, username: profileMap.get(row.user_id)?.username || 'Usuario', avatar: profileMap.get(row.user_id)?.avatar_url || '/avatar_por_defecto.jpeg', reaction: row.reaction, updatedAtMs: toMillisSafe(row.updated_at) }));
  }
  const reactionsRef = getStateReactionsCollectionRef(roomId, stateUserId);
  const q = query(reactionsRef, orderBy('updatedAt', 'desc'), limit(200));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data() || {};
    return {
      id: docSnap.id,
      userId: data.userId || docSnap.id,
      username: data.username || 'Usuario',
      avatar: data.avatar || '/avatar_por_defecto.jpeg',
      reaction: data.reaction || null,
      updatedAtMs: toMillisSafe(data.updatedAt),
    };
  }).filter((item) => ALLOWED_STATE_REACTIONS.includes(item.reaction));
};

export const setStateReaction = async (roomId, stateUserId, payload = {}) => {
  if (!roomId || !stateUserId) throw new Error('state/reaction-invalid-target');
  if (isSupabaseAuthEnabled()) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) throw new Error('state/auth-required');
    if (authData.user.is_anonymous || payload?.isGuest || payload?.isAnonymous) throw new Error('state/registered-only');
    const reaction = String(payload?.reaction || '').trim();
    if (!ALLOWED_STATE_REACTIONS.includes(reaction)) throw new Error('state/invalid-reaction');
    const { data: state, error: stateError } = await supabase.from('room_states').select('id').eq('room_id', roomId).eq('author_id', stateUserId).maybeSingle();
    if (stateError) throw stateError;
    if (!state) throw new Error('state/not-found');
    const { error } = await supabase.from('room_state_reactions').upsert({ room_state_id: state.id, user_id: authData.user.id, reaction, updated_at: new Date().toISOString() }, { onConflict: 'room_state_id,user_id' });
    if (error) throw error;
    return { ok: true, reaction };
  }
  if (!auth.currentUser?.uid) throw new Error('state/auth-required');
  if (auth.currentUser.isAnonymous || payload?.isGuest || payload?.isAnonymous) {
    throw new Error('state/registered-only');
  }

  const reaction = String(payload?.reaction || '').trim();
  if (!ALLOWED_STATE_REACTIONS.includes(reaction)) {
    throw new Error('state/invalid-reaction');
  }

  const reactionRef = getStateReactionDocRef(roomId, stateUserId, auth.currentUser.uid);
  await setDoc(reactionRef, {
    userId: auth.currentUser.uid,
    username: payload?.username || 'Usuario',
    avatar: payload?.avatar || '/avatar_por_defecto.jpeg',
    reaction,
    updatedAt: serverTimestamp(),
  }, { merge: true });

  return { ok: true, reaction };
};

export const clearStateReaction = async (roomId, stateUserId) => {
  if (!roomId || !stateUserId) throw new Error('state/reaction-invalid-target');
  if (isSupabaseAuthEnabled()) {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id || authData.user.is_anonymous) throw new Error('state/registered-only');
    const { data: state, error: stateError } = await supabase.from('room_states').select('id').eq('room_id', roomId).eq('author_id', stateUserId).maybeSingle();
    if (stateError) throw stateError;
    if (!state) return { ok: true };
    const { error } = await supabase.from('room_state_reactions').delete().eq('room_state_id', state.id).eq('user_id', authData.user.id);
    if (error) throw error;
    return { ok: true };
  }
  if (!auth.currentUser?.uid) throw new Error('state/auth-required');
  if (auth.currentUser.isAnonymous) throw new Error('state/registered-only');

  await deleteDoc(getStateReactionDocRef(roomId, stateUserId, auth.currentUser.uid));
  return { ok: true };
};

export const formatStateCooldown = (remainingMs) => {
  const safeMs = Math.max(0, Number(remainingMs) || 0);
  const hours = Math.floor(safeMs / (60 * 60 * 1000));
  const minutes = Math.ceil((safeMs % (60 * 60 * 1000)) / (60 * 1000));
  if (hours <= 0) return `${minutes} min`;
  if (minutes <= 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
};
