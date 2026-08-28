import { supabase } from '@/config/supabase';

const ensureClient = () => {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
};

const currentUser = async () => {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error('NOT_AUTHENTICATED');
  return data.user;
};

const safeRoomId = (roomId) => String(roomId || '').trim().slice(0, 80);

const mapPresence = (row = {}) => {
  const profile = row.profile || row.profiles || {};
  const lastSeen = row.last_seen_at || row.updated_at || null;
  return {
    id: row.user_id,
    userId: row.user_id,
    username: profile.username || 'Usuario',
    avatar: profile.avatar_url || '',
    isPremium: Boolean(profile.is_premium),
    profileRole: profile.profile_role || '',
    comuna: row.comuna || profile.comuna || '',
    isOnline: row.is_online === true,
    estaOnline: row.is_online === true,
    connectionStatus: row.connection_status || 'offline',
    availableForChat: row.available_for_chat === true && (!row.available_for_chat_expires_at || new Date(row.available_for_chat_expires_at).getTime() > Date.now()),
    lastSeen,
    ultimaConexion: lastSeen,
    lastSeenMs: lastSeen ? new Date(lastSeen).getTime() : 0,
    lastSeenAt: lastSeen,
    joinedAt: row.created_at || null,
  };
};

const selectPresence = '*, profile:profiles(id, username, avatar_url, is_premium, profile_role, comuna)';

export const joinRoom = async (roomId, userData = {}) => {
  const actor = await currentUser();
  const safeId = safeRoomId(roomId);
  if (!safeId) throw new Error('INVALID_ROOM');
  const client = ensureClient();
  const now = new Date().toISOString();
  const { error } = await client.from('room_presence').upsert({
    room_id: safeId,
    user_id: actor.id,
    is_online: true,
    connection_status: 'online',
    available_for_chat: userData.availableForChat === true,
    available_for_chat_expires_at: userData.availableForChat === true ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null,
    comuna: String(userData.comuna || '').slice(0, 80) || null,
    last_seen_at: now,
  }, { onConflict: 'room_id,user_id' });
  if (error) throw error;
  return { success: true, userId: actor.id };
};

export const leaveRoom = async (roomId) => {
  const actor = await currentUser();
  const { error } = await ensureClient().from('room_presence').update({ is_online: false, connection_status: 'offline', available_for_chat: false, last_seen_at: new Date().toISOString() }).eq('room_id', safeRoomId(roomId)).eq('user_id', actor.id);
  if (error) throw error;
  return { success: true };
};

export const updatePresenceFields = async (roomId, fields = {}) => {
  const actor = await currentUser();
  const safeFields = {};
  if (typeof fields.isOnline === 'boolean' || typeof fields.estaOnline === 'boolean') safeFields.is_online = fields.isOnline ?? fields.estaOnline;
  if (typeof fields.connectionStatus === 'string') safeFields.connection_status = fields.connectionStatus === 'connected' ? 'online' : fields.connectionStatus;
  if (typeof fields.availableForChat === 'boolean') {
    safeFields.available_for_chat = fields.availableForChat;
    safeFields.available_for_chat_expires_at = fields.availableForChat ? new Date(Date.now() + 10 * 60 * 1000).toISOString() : null;
  }
  if (typeof fields.comuna === 'string') safeFields.comuna = fields.comuna.slice(0, 80) || null;
  safeFields.last_seen_at = new Date().toISOString();
  const { error } = await ensureClient().from('room_presence').upsert({ room_id: safeRoomId(roomId), user_id: actor.id, ...safeFields }, { onConflict: 'room_id,user_id' });
  if (error) throw error;
  return { success: true };
};

export const updateUserActivity = async (roomId, options = {}) => updatePresenceFields(roomId, { isOnline: true, connectionStatus: 'online', ...(options || {}) });
export const setAvailabilityForConversation = async (roomId, enabled = true) => updatePresenceFields(roomId, { availableForChat: enabled });
export const setInPrivateChat = async (roomId, partnerId) => { const actor = await currentUser(); const { error } = await ensureClient().from('room_presence').update({ in_private_with: partnerId || null, last_seen_at: new Date().toISOString() }).eq('room_id', safeRoomId(roomId)).eq('user_id', actor.id); if (error) throw error; return { success: true }; };
export const clearInPrivateChat = async (roomId) => setInPrivateChat(roomId, null);

export const getRoomPresenceUser = async (roomId, userId) => {
  const { data, error } = await ensureClient().from('room_presence').select(selectPresence).eq('room_id', safeRoomId(roomId)).eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? mapPresence(data) : null;
};

export const validateUserAvailabilityInRoom = async (roomId, userId) => {
  const entry = await getRoomPresenceUser(roomId, userId);
  return Boolean(entry?.availableForChat);
};

export const subscribeToRoomUsers = (roomId, callback, limitCount = 100) => {
  let client;
  try { client = ensureClient(); } catch { callback?.([]); return () => {}; }
  let active = true;
  const load = async () => {
    const { data } = await client.from('room_presence').select(selectPresence).eq('room_id', safeRoomId(roomId)).eq('is_online', true).order('last_seen_at', { ascending: false }).limit(Math.min(Number(limitCount) || 100, 200));
    if (active) callback?.((data || []).map(mapPresence));
  };
  load();
  const channel = client.channel(`room-presence:${safeRoomId(roomId)}`).on('postgres_changes', { event: '*', schema: 'public', table: 'room_presence', filter: `room_id=eq.${safeRoomId(roomId)}` }, load).subscribe();
  return () => { active = false; client.removeChannel(channel); };
};

export const subscribeToMultipleRoomCounts = (roomIds = [], callback) => {
  const safeIds = roomIds.map(safeRoomId).filter(Boolean);
  let active = true;
  let unsubscribers = [];
  const load = async () => {
    const counts = {};
    for (const roomId of safeIds) {
      const { count } = await ensureClient().from('room_presence').select('user_id', { count: 'exact', head: true }).eq('room_id', roomId).eq('is_online', true);
      counts[roomId] = Number(count || 0);
    }
    if (active) callback?.(counts);
  };
  load();
  unsubscribers = safeIds.map((roomId) => {
    const channel = ensureClient().channel(`room-count:${roomId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'room_presence', filter: `room_id=eq.${roomId}` }, load).subscribe();
    return () => ensureClient().removeChannel(channel);
  });
  return () => { active = false; unsubscribers.forEach((unsubscribe) => unsubscribe()); };
};

export const subscribeToRoomUserCount = (roomId, callback) => subscribeToMultipleRoomCounts([roomId], (counts) => callback?.(counts[safeRoomId(roomId)] || 0));
export const cleanInactiveUsers = async () => ({ success: true, removed: 0 });
export const filterActiveUsers = (users = []) => users.filter((user) => user?.isOnline === true || user?.estaOnline === true);
export const subscribeToTypingUsers = () => { return () => {}; };
export const updateTypingStatus = async () => ({ success: true });
export const recordGlobalActivity = async () => ({ success: true });
export const subscribeToLastActivity = (callback) => { callback?.(null); return () => {}; };

export default { joinRoom, leaveRoom, updatePresenceFields, updateUserActivity, setAvailabilityForConversation, setInPrivateChat, clearInPrivateChat, getRoomPresenceUser, validateUserAvailabilityInRoom, subscribeToRoomUsers, subscribeToMultipleRoomCounts, subscribeToRoomUserCount, filterActiveUsers };
