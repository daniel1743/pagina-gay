import { supabase } from '@/config/supabase';
import { refreshSignedMediaUrl } from '@/services/supabaseMediaService';

const MAX_CARD_LIMIT = 120;
const CHILE_TIME_ZONE = 'America/Santiago';

const ensureClient = () => {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
};

const getCurrentUser = async () => {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error('NOT_AUTHENTICATED');
  return data.user;
};

const toDateMs = (value) => {
  if (!value) return 0;
  const date = value instanceof Date ? value : new Date(value);
  const ms = date.getTime();
  return Number.isFinite(ms) ? ms : 0;
};

const toIsoOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
};

const getChileDay = (date = new Date()) => {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: CHILE_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
};

const mapProfile = (profile = {}) => ({
  id: profile.id,
  username: profile.username || 'Usuario',
  avatar: profile.avatar_url || null,
  avatar_url: profile.avatar_url || null,
  age: profile.age ?? null,
  profileRole: profile.profile_role || null,
  comuna: profile.comuna || null,
  bio: profile.bio || '',
  isGuest: Boolean(profile.is_guest),
  verified: Boolean(profile.verified),
});

export const mapSupabaseCardToLegacy = (row = {}, profile = {}) => {
  const identity = mapProfile(profile);
  const expiresAt = row.intent_expires_at || null;
  const active = !expiresAt || toDateMs(expiresAt) > Date.now();
  const displayAge = row.mostrar_edad ? identity.age : null;
  return {
    id: row.user_id,
    odIdUsuari: row.user_id,
    odIdUsuariNombre: identity.username,
    nombre: identity.username,
    edad: displayAge,
    age: displayAge,
    rol: identity.profileRole || '',
    profileRole: identity.profileRole,
    comuna: row.comuna || identity.comuna || '',
    ubicacionTexto: row.comuna || identity.comuna || '',
    ubicacion: null,
    ubicacionActiva: false,
    bio: identity.bio,
    buscando: row.legacy_buscando || '',
    intencion: row.intent_type || 'sin_definir',
    intentType: row.intent_type || 'sin_definir',
    intencionFrase: row.intent_text || '',
    intentText: row.intent_text || '',
    intencionExpiracion: expiresAt,
    intentExpiresAt: expiresAt,
    intentActive: active,
    mostrarEdad: Boolean(row.mostrar_edad),
    fotoUrl: row.foto_url || identity.avatar || '',
    fotoUrlThumb: row.foto_url || identity.avatar || '',
    fotoUrlFull: row.foto_url || identity.avatar || '',
    fotoPath: row.foto_path || null,
    fotoBucket: row.foto_bucket || null,
    foto2Path: row.foto2_path || null,
    foto2Bucket: row.foto2_bucket || null,
    fotoUrl2: row.foto_url2 || null,
    avatar: identity.avatar,
    estaOnline: false,
    ultimaConexion: null,
    cardVisible: Boolean(row.card_visible),
    actualizadaEn: row.updated_at || null,
    creadaEn: row.created_at || null,
    likesRecibidos: 0,
    huellasRecibidas: 0,
    visitasRecibidas: 0,
    impresionesRecibidas: 0,
    actividadNoLeida: 0,
    _backend: 'supabase',
  };
};

const fetchProfiles = async (ids = []) => {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) return new Map();
  const client = ensureClient();
  const { data, error } = await client.from('profiles').select('*').in('id', uniqueIds);
  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
};

const hydrateCardMedia = async (card) => {
  const signedPrimary = card?.fotoPath && card?.fotoBucket
    ? await refreshSignedMediaUrl(card.fotoBucket, card.fotoPath).catch(() => null)
    : null;
  const signedSecond = card?.foto2Path && card?.foto2Bucket
    ? await refreshSignedMediaUrl(card.foto2Bucket, card.foto2Path).catch(() => null)
    : null;
  return {
    ...card,
    ...(signedPrimary ? { fotoUrl: signedPrimary, fotoUrlThumb: signedPrimary, fotoUrlFull: signedPrimary } : {}),
    ...(signedSecond ? { fotoUrl2: signedSecond } : {}),
  };
};

const fetchVisibleCards = async ({ ownerId = null, limit = MAX_CARD_LIMIT, order = 'updated_at' } = {}) => {
  const client = ensureClient();
  const safeLimit = Math.max(1, Math.min(Number(limit) || MAX_CARD_LIMIT, MAX_CARD_LIMIT));
  let query = client.from('baul_cards').select('*');
  if (ownerId) query = query.eq('user_id', ownerId);
  else query = query.eq('card_visible', true);
  query = query.order(order, { ascending: false }).limit(safeLimit);
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const userIds = rows.map((row) => row.user_id).filter(Boolean);
  const profiles = await fetchProfiles(userIds);
  const { data: presenceRows } = userIds.length
    ? await client.from('room_presence').select('user_id, is_online, last_seen_at').in('user_id', userIds).eq('is_online', true)
    : { data: [] };
  const presenceByUser = new Map();
  (presenceRows || []).forEach((presence) => {
    if (!presence?.user_id) return;
    const previous = presenceByUser.get(presence.user_id);
    if (!previous || toDateMs(presence.last_seen_at) > toDateMs(previous.last_seen_at)) presenceByUser.set(presence.user_id, presence);
  });
  return Promise.all(rows.map((row) => {
    const presence = presenceByUser.get(row.user_id);
    const card = mapSupabaseCardToLegacy(row, profiles.get(row.user_id));
    return hydrateCardMedia({
      ...card,
      estaOnline: Boolean(presence?.is_online),
      ultimaConexion: presence?.last_seen_at || null,
    });
  }));
};

export const obtenerTarjeta = async (userId) => {
  try {
    const cards = await fetchVisibleCards({ ownerId: userId, limit: 1 });
    return cards[0] || null;
  } catch {
    return null;
  }
};

export const crearTarjetaAutomatica = async (usuario = {}) => {
  try {
    const authUser = await getCurrentUser();
    const userId = authUser.id;
    const client = ensureClient();
    const { data: profile } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
    const { data, error } = await client
      .from('baul_cards')
      .upsert({
        user_id: userId,
        card_visible: false,
        intent_type: 'sin_definir',
        comuna: usuario.comuna || profile?.comuna || null,
        mostrar_edad: false,
        foto_url: usuario.avatar || profile?.avatar_url || null,
        legacy_buscando: '',
      }, { onConflict: 'user_id' })
      .select('*')
      .single();
    if (error) throw error;
    return mapSupabaseCardToLegacy(data, profile || {});
  } catch {
    return null;
  }
};

const toCardPatch = (data = {}) => {
  const patch = {};
  const assign = (key, value) => {
    if (value !== undefined) patch[key] = value;
  };
  assign('card_visible', data.cardVisible ?? data.visible);
  const intentType = data.intentType ?? data.intencion ?? (data.buscando ? 'sin_definir' : undefined);
  assign('intent_type', intentType);
  assign('intent_text', data.intentText ?? data.intencionFrase);
  assign('intent_expires_at', toIsoOrNull(data.intentExpiresAt ?? data.intencionExpiracion));
  assign('comuna', data.comuna ?? data.ubicacionTexto);
  assign('mostrar_edad', data.mostrarEdad);
  assign('foto_url', data.fotoUrl ?? data.fotoUrlFull ?? data.avatar);
  assign('foto_path', data.fotoPath);
  assign('foto_bucket', data.fotoBucket);
  assign('foto2_path', data.foto2Path);
  assign('foto2_bucket', data.foto2Bucket);
  assign('legacy_buscando', data.buscando);
  return Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined));
};

export const actualizarTarjeta = async (userId, data = {}) => {
  try {
    const authUser = await getCurrentUser();
    if (authUser.id !== userId) throw new Error('NOT_CARD_OWNER');
    const patch = toCardPatch(data);
    if (!Object.keys(patch).length) return false;
    const client = ensureClient();
    const { error } = await client.from('baul_cards').upsert({ user_id: userId, ...patch }, { onConflict: 'user_id' });
    if (error) throw error;
    return true;
  } catch {
    return false;
  }
};

export const obtenerTarjetasRecientes = async (_myUserId, limit = 100) => {
  return fetchVisibleCards({ limit, order: 'updated_at' });
};

export const obtenerTarjetasCercanas = async (_location, myUserId, limit = 100) => {
  const cards = await fetchVisibleCards({ limit, order: 'updated_at' });
  return cards.filter((card) => card.odIdUsuari !== myUserId);
};

export const actualizarEstadoOnline = async (userId, estaOnline, roomId = 'principal') => {
  const actor = await getCurrentUser();
  if (actor.id !== userId) throw new Error('AUTH_USER_MISMATCH');
  const client = ensureClient();
  const safeRoomId = String(roomId || 'principal').trim().slice(0, 80) || 'principal';
  const patch = {
    room_id: safeRoomId,
    user_id: actor.id,
    is_online: Boolean(estaOnline),
    connection_status: estaOnline ? 'online' : 'offline',
    available_for_chat: false,
    last_seen_at: new Date().toISOString(),
  };
  const { error } = await client.from('room_presence').upsert(patch, { onConflict: 'room_id,user_id' });
  if (error) throw error;
  return { success: true, roomId: safeRoomId, isOnline: Boolean(estaOnline) };
};

const rpc = async (name, args) => {
  const client = ensureClient();
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data;
};

const setLike = async (targetId, desiredLiked) => {
  try {
    const rows = await rpc('set_baul_like', { target_user_id: targetId, desired_liked: Boolean(desiredLiked) });
    const result = Array.isArray(rows) ? rows[0] : rows;
    return { success: true, liked: Boolean(result?.liked), isMatch: Boolean(result?.is_match), matchKey: result?.match_key || null };
  } catch (error) {
    return { success: false, error };
  }
};

export const toggleLike = async (targetId) => {
  try {
    const rows = await rpc('toggle_baul_like', { target_user_id: targetId });
    const result = Array.isArray(rows) ? rows[0] : rows;
    return { success: true, liked: Boolean(result?.liked), isMatch: Boolean(result?.is_match), matchKey: result?.match_key || null };
  } catch (error) {
    return { success: false, error };
  }
};
export const darLike = async (targetId) => setLike(targetId, true);
export const quitarLike = async (targetId) => setLike(targetId, false);

export const registrarVisita = async (targetId) => {
  try {
    const rows = await rpc('record_baul_daily_event', { target_user_id: targetId, event_type: 'visit' });
    const result = Array.isArray(rows) ? rows[0] : rows;
    return { success: true, recorded: Boolean(result?.recorded) };
  } catch (error) {
    return { success: false, recorded: false, error };
  }
};

export const registrarImpresion = async (targetId) => {
  try {
    const rows = await rpc('record_baul_daily_event', { target_user_id: targetId, event_type: 'impression' });
    const result = Array.isArray(rows) ? rows[0] : rows;
    return { success: true, recorded: Boolean(result?.recorded) };
  } catch (error) {
    return { success: false, recorded: false, error };
  }
};

export const dejarHuella = async (targetId) => {
  try {
    const rows = await rpc('record_baul_daily_event', { target_user_id: targetId, event_type: 'footprint' });
    const result = Array.isArray(rows) ? rows[0] : rows;
    return { success: true, recorded: Boolean(result?.recorded) };
  } catch (error) {
    return { success: false, recorded: false, error };
  }
};

export const enviarMensajeTarjeta = async (targetId, _username, content) => {
  try {
    const rows = await rpc('send_baul_note', { target_user_id: targetId, note_content: content });
    const result = Array.isArray(rows) ? rows[0] : rows;
    return { success: true, noteId: result?.note_id || null };
  } catch (error) {
    return { success: false, error };
  }
};

export const yaLeDiLike = async (targetId, actorId) => {
  try {
    const client = ensureClient();
    const { data, error } = await client.from('baul_likes').select('target_id').eq('actor_id', actorId).eq('target_id', targetId).maybeSingle();
    if (error) throw error;
    return Boolean(data);
  } catch {
    return false;
  }
};

export const verificarMatch = async (firstId, secondId) => {
  try {
    const client = ensureClient();
    const userA = [firstId, secondId].sort()[0];
    const userB = [firstId, secondId].sort()[1];
    const { data, error } = await client.from('baul_matches').select('*').eq('user_a', userA).eq('user_b', userB).eq('status', 'active').maybeSingle();
    if (error) throw error;
    return Boolean(data);
  } catch {
    return false;
  }
};

export const obtenerMisMatches = async (userId) => {
  try {
    const actor = await getCurrentUser();
    if (actor.id !== userId) throw new Error('AUTH_USER_MISMATCH');
    const client = ensureClient();
    const { data, error } = await client.from('baul_matches').select('*').or(`user_a.eq.${actor.id},user_b.eq.${actor.id}`).eq('status', 'active').order('updated_at', { ascending: false });
    if (error) throw error;
    const rows = data || [];
    const { data: reads, error: readsError } = await client.from('baul_match_reads').select('user_a, user_b, read_at').eq('user_id', actor.id);
    if (readsError) throw readsError;
    const readMap = new Map((reads || []).map((read) => [`${read.user_a}_${read.user_b}`, read.read_at]));
    const profiles = await fetchProfiles(rows.flatMap((row) => [row.user_a, row.user_b]));
    return rows.map((row) => {
      const id = `${row.user_a}_${row.user_b}`;
      const readAt = readMap.get(id);
      return {
        id,
        userA: mapProfile(profiles.get(row.user_a)),
        userB: mapProfile(profiles.get(row.user_b)),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        status: row.status,
        read: Boolean(readAt && new Date(readAt).getTime() >= new Date(row.updated_at).getTime()),
      };
    });
  } catch {
    return [];
  }
};

export const contarMatchesNoLeidos = async (userId) => {
  const actor = await getCurrentUser();
  if (actor.id !== userId) throw new Error('AUTH_USER_MISMATCH');
  const rows = await rpc('get_my_baul_unread_match_count', {});
  return Number(Array.isArray(rows) ? rows[0] : rows) || 0;
};

export const marcarMatchLeido = async (matchId, userId) => {
  const actor = await getCurrentUser();
  if (actor.id !== userId) throw new Error('AUTH_USER_MISMATCH');
  const matchKey = String(matchId || '').trim();
  if (!matchKey) throw new Error('INVALID_MATCH_KEY');
  const result = await rpc('mark_my_baul_match_read', { match_key: matchKey });
  return { success: Boolean(result), read: Boolean(result), matchId: matchKey };
};

export const obtenerMiActividad = async (userId, limit = 20) => {
  try {
    const client = ensureClient();
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
    const { data, error } = await client.from('baul_footprints').select('*').eq('target_id', userId).order('created_at', { ascending: false }).limit(safeLimit);
    if (error) throw error;
    return data || [];
  } catch {
    return [];
  }
};

export const obtenerMetricasTarjeta = async (userId) => {
  try {
    const client = ensureClient();
    const [likes, footprints, visits, impressions] = await Promise.all([
      client.from('baul_likes').select('*', { count: 'exact', head: true }).eq('target_id', userId),
      client.from('baul_footprints').select('*', { count: 'exact', head: true }).eq('target_id', userId),
      client.from('baul_visits').select('*', { count: 'exact', head: true }).eq('target_id', userId),
      client.from('baul_impressions').select('*', { count: 'exact', head: true }).eq('target_id', userId),
    ]);
    const failure = [likes, footprints, visits, impressions].find((result) => result.error);
    if (failure) throw failure.error;
    return {
      likesRecibidos: likes.count || 0,
      huellasRecibidas: footprints.count || 0,
      visitasRecibidas: visits.count || 0,
      impresionesRecibidas: impressions.count || 0,
    };
  } catch {
    return { likesRecibidos: 0, huellasRecibidas: 0, visitasRecibidas: 0, impresionesRecibidas: 0 };
  }
};

export const suscribirseAMiTarjeta = (userId, callback) => {
  let client;
  try {
    client = ensureClient();
  } catch {
    return () => {};
  }
  const channel = client
    .channel(`baul-card:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'baul_cards', filter: `user_id=eq.${userId}` }, (payload) => {
      callback?.(payload.new || null);
    })
    .subscribe();
  return () => client.removeChannel(channel);
};

export const getBaulDayKey = getChileDay;

export default {
  obtenerTarjeta,
  crearTarjetaAutomatica,
  actualizarTarjeta,
  obtenerTarjetasRecientes,
  obtenerTarjetasCercanas,
  actualizarEstadoOnline,
  toggleLike,
  darLike,
  quitarLike,
  registrarVisita,
  registrarImpresion,
  dejarHuella,
  enviarMensajeTarjeta,
  yaLeDiLike,
  verificarMatch,
  obtenerMisMatches,
  contarMatchesNoLeidos,
  marcarMatchLeido,
  obtenerMiActividad,
  obtenerMetricasTarjeta,
  suscribirseAMiTarjeta,
  mapSupabaseCardToLegacy,
  getBaulDayKey,
};
