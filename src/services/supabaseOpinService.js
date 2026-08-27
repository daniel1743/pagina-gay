import { supabase } from '@/config/supabase';

const MAX_POST_LENGTH = 3000;
const MAX_COMMENT_LENGTH = 1200;
const ACTIVE_WINDOW_DAYS = 60;
const OPEN_STATUSES = new Set(['buscando', 'hablando', 'quiero_mas']);

const ensureClient = () => {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
};

const getAuthUser = async () => {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  if (!data.user?.id) throw new Error('NOT_AUTHENTICATED');
  return data.user;
};

const normalize = (row = {}, profile = {}) => {
  const createdAt = row.created_at || null;
  const updatedAt = row.updated_at || createdAt;
  const lastInteractionAt = row.last_interaction_at || row.last_comment_at || updatedAt || createdAt;
  return {
    ...row,
    id: row.id,
    postId: row.id,
    userId: row.author_id,
    profileId: row.author_id,
    username: profile.username || 'Usuario',
    avatar: profile.avatar_url || '',
    title: row.title || '',
    text: row.content || '',
    content: row.content || '',
    color: row.color || 'purple',
    status: row.status || 'buscando',
    type: row.type || 'crush',
    contactMethod: row.contact_method || 'chactivo',
    contactValue: row.contact_value || '',
    imageUrl: row.image_url || '',
    isActive: row.is_active !== false && row.status !== 'deleted' && row.status !== 'hidden',
    isStable: Boolean(row.is_stable),
    isGuest: Boolean(row.is_guest),
    createdAt,
    updatedAt,
    expiresAt: row.expires_at || row.intent_expires_at || null,
    intentExpiresAt: row.intent_expires_at || row.expires_at || null,
    lastInteractionAt,
    lastCommentAt: row.last_comment_at || null,
    likeCount: Number(row.like_count || 0),
    commentCount: Number(row.comment_count || 0),
    viewCount: Number(row.view_count || 0),
    profileClickCount: Number(row.profile_click_count || 0),
    reactionCounts: row.reaction_counts && typeof row.reaction_counts === 'object' ? row.reaction_counts : {},
    likedBy: row._likedBy || [],
    reactions: row._reactions || {},
    _backend: 'supabase',
  };
};

const fetchProfiles = async (ids = []) => {
  const client = ensureClient();
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const { data, error } = await client.from('profiles').select('id, username, avatar_url, age, comuna, profile_role').in('id', unique);
  if (error) throw error;
  return new Map((data || []).map((profile) => [profile.id, profile]));
};

const fetchPostRows = async (query) => {
  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];
  const profiles = await fetchProfiles(rows.map((row) => row.author_id));
  let currentUserId = null;
  try {
    currentUserId = (await getAuthUser()).id;
  } catch {
    // Feed público: no es un error que no exista sesión.
  }

  const postIds = rows.map((row) => row.id);
  const client = ensureClient();
  const [likesResult, reactionsResult] = await Promise.all([
    currentUserId && postIds.length
      ? client.from('opin_likes').select('post_id').eq('user_id', currentUserId).in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
    postIds.length
      ? client.from('opin_reactions').select('post_id, user_id, reaction').in('post_id', postIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (likesResult.error) throw likesResult.error;
  if (reactionsResult.error) throw reactionsResult.error;
  const likedIds = new Set((likesResult.data || []).map((like) => like.post_id));
  const reactionMap = new Map();
  (reactionsResult.data || []).forEach((reaction) => {
    const counts = reactionMap.get(reaction.post_id) || {};
    counts[reaction.reaction] = (counts[reaction.reaction] || 0) + 1;
    reactionMap.set(reaction.post_id, counts);
  });

  return rows.map((row) => normalize({
    ...row,
    _likedBy: likedIds.has(row.id) && currentUserId ? [currentUserId] : [],
    _reactions: reactionMap.get(row.id) || {},
    reaction_counts: reactionMap.get(row.id) || row.reaction_counts || {},
  }, profiles.get(row.author_id)));
};

const validatePublicText = (text) => {
  const normalized = String(text || '').trim();
  if (normalized.length < 10) throw new Error('El texto debe tener al menos 10 caracteres');
  if (normalized.length > MAX_POST_LENGTH) throw new Error('El texto no puede superar 3000 caracteres');
  if (/(https?:\/\/|www\.|wa\.me|t\.me|whatsapp|telegram|instagram|facebook|discord)/i.test(normalized)) {
    throw new Error('No publiques datos de contacto externo en OPIN. Usa el chat de Chactivo.');
  }
  return normalized;
};

export const canCreatePost = async () => {
  try {
    const user = await getAuthUser();
    if (user.is_anonymous) return { canCreate: false, reason: 'guest_user' };
    const client = ensureClient();
    const since = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data, error } = await client.from('opin_posts').select('id, status, is_active, is_stable, created_at').eq('author_id', user.id).gte('created_at', since).order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    const rows = data || [];
    const hasOpenIntent = rows.some((row) => row.is_active !== false && !row.is_stable && OPEN_STATUSES.has(row.status));
    if (hasOpenIntent) return { canCreate: false, reason: 'active_intent', message: 'Ya tienes una intención activa. Actualízala o ciérrala antes de abrir otra.' };
    const last = rows[0]?.created_at ? new Date(rows[0].created_at).getTime() : 0;
    if (last && Date.now() - last < 2 * 60 * 60 * 1000) {
      const remainingMinutes = Math.ceil((last + 2 * 60 * 60 * 1000 - Date.now()) / 60000);
      return { canCreate: false, reason: 'cooldown', remainingMinutes, message: `Espera ${remainingMinutes} minutos para publicar otra nota.` };
    }
    return { canCreate: true };
  } catch (error) {
    return { canCreate: false, reason: 'error', message: error?.message || 'No se pudo comprobar el límite de publicación.' };
  }
};

export const createOpinPost = async ({ title = '', text, color = 'purple', userProfile = {}, status = 'buscando', type = 'crush', contactMethod = 'chactivo', contactValue = '', imageUrl = '' } = {}) => {
  const user = await getAuthUser();
  if (user.is_anonymous) throw new Error('Los invitados no pueden publicar en OPIN');
  const content = validatePublicText(text);
  const permission = await canCreatePost();
  if (!permission.canCreate) throw new Error(permission.message || 'No puedes publicar todavía.');
  const client = ensureClient();
  const now = Date.now();
  const expiresAt = new Date(now + ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client.from('opin_posts').insert({
    author_id: user.id,
    title: String(title || '').trim().slice(0, 160),
    content,
    color: String(color || 'purple').slice(0, 40),
    status: OPEN_STATUSES.has(status) ? status : 'buscando',
    type: String(type || 'crush').slice(0, 60),
    contact_method: String(contactMethod || 'chactivo').slice(0, 40),
    contact_value: String(contactValue || '').trim().slice(0, 200),
    image_url: String(imageUrl || '').trim().slice(0, 1000),
    is_guest: false,
    is_active: true,
    is_stable: false,
    expires_at: expiresAt,
    intent_type: status,
    intent_expires_at: expiresAt,
    last_interaction_at: new Date(now).toISOString(),
  }).select('*').single();
  if (error) throw error;
  return normalize(data, { username: userProfile.username || user.user_metadata?.username, avatar_url: userProfile.avatar || user.user_metadata?.avatar_url });
};

export const getOpinFeed = async (limitCount = 36) => {
  const client = ensureClient();
  const limit = Math.max(12, Math.min(Number(limitCount) || 36, 60));
  const { data, error } = await client.from('opin_posts').select('*').eq('is_active', true).is('deleted_at', null).order('last_interaction_at', { ascending: false }).order('created_at', { ascending: false }).limit(limit * 3);
  if (error) throw error;
  const now = Date.now();
  const rows = (data || []).filter((row) => row.is_stable || !row.expires_at || new Date(row.expires_at).getTime() > now);
  const diversified = [];
  const countByAuthor = new Map();
  for (const row of rows) {
    const count = countByAuthor.get(row.author_id) || 0;
    if (count >= 3) continue;
    diversified.push(row);
    countByAuthor.set(row.author_id, count + 1);
    if (diversified.length >= limit) break;
  }
  return fetchPostRows(Promise.resolve({ data: diversified, error: null }));
};

export const getOpinPostsByUserId = async (userId, limitCount = 10) => {
  const client = ensureClient();
  const { data, error } = await client.from('opin_posts').select('*').eq('author_id', userId).eq('is_active', true).is('deleted_at', null).order('created_at', { ascending: false }).limit(Math.min(Number(limitCount) || 10, 20));
  if (error) throw error;
  return fetchPostRows(Promise.resolve({ data: data || [], error: null }));
};

export const getMyOpinPosts = async (limitCount = 10) => {
  const user = await getAuthUser();
  const client = ensureClient();
  const { data, error } = await client.from('opin_posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false }).limit(Math.min(Number(limitCount) || 10, 50));
  if (error) throw error;
  return fetchPostRows(Promise.resolve({ data: data || [], error: null }));
};

export const getMyActiveOpinIntent = async () => {
  const user = await getAuthUser();
  const client = ensureClient();
  const { data, error } = await client.from('opin_posts').select('*').eq('author_id', user.id).eq('is_active', true).in('status', [...OPEN_STATUSES]).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const rows = await fetchPostRows(Promise.resolve({ data: [data], error: null }));
  return rows[0] || null;
};

export const getOpenOpinIntentsByUserIds = async (userIds = []) => {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (!ids.length) return [];
  const client = ensureClient();
  const { data, error } = await client.from('opin_posts').select('*').in('author_id', ids).eq('is_active', true).in('status', [...OPEN_STATUSES]).order('created_at', { ascending: false });
  if (error) throw error;
  return fetchPostRows(Promise.resolve({ data: data || [], error: null }));
};

export const getOpinPostById = async (postId) => {
  const client = ensureClient();
  const { data, error } = await client.from('opin_posts').select('*').eq('id', postId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const rows = await fetchPostRows(Promise.resolve({ data: [data], error: null }));
  return rows[0] || null;
};

export const editOpinPost = async (postId, updates = {}) => {
  const user = await getAuthUser();
  const client = ensureClient();
  const patch = {};
  if (updates.title !== undefined) patch.title = String(updates.title || '').trim().slice(0, 160);
  if (updates.text !== undefined) patch.content = validatePublicText(updates.text);
  if (updates.color !== undefined) patch.color = String(updates.color || 'purple').slice(0, 40);
  if (updates.status !== undefined) patch.status = OPEN_STATUSES.has(updates.status) ? updates.status : 'cerrado';
  if (updates.type !== undefined) patch.type = String(updates.type || 'crush').slice(0, 60);
  if (updates.contactMethod !== undefined) patch.contact_method = String(updates.contactMethod || 'chactivo').slice(0, 40);
  if (updates.contactValue !== undefined) patch.contact_value = String(updates.contactValue || '').trim().slice(0, 200);
  if (updates.imageUrl !== undefined) patch.image_url = String(updates.imageUrl || '').trim().slice(0, 1000);
  if (patch.status === 'cerrado') patch.is_active = false;
  const { data, error } = await client.from('opin_posts').update(patch).eq('id', postId).eq('author_id', user.id).select('*').single();
  if (error) throw error;
  return normalize(data, {});
};

export const updateOpinStatus = async (postId, status) => editOpinPost(postId, { status });

export const deleteOpinPost = async (postId) => {
  const user = await getAuthUser();
  const client = ensureClient();
  const { error } = await client.from('opin_posts').update({ status: 'deleted', is_active: false, deleted_at: new Date().toISOString() }).eq('id', postId).eq('author_id', user.id);
  if (error) throw error;
  return true;
};

const recordOpinAction = async (postId, actionType) => {
  await getAuthUser();
  const { data, error } = await ensureClient().rpc('record_opin_action', {
    target_post_id: postId,
    target_action_type: actionType,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    success: true,
    recorded: Boolean(row?.recorded),
    viewCount: Number(row?.view_count || 0),
    profileClickCount: Number(row?.profile_click_count || 0),
    postId,
    actionType,
  };
};

export const incrementViewCount = async (postId) => recordOpinAction(postId, 'view');
export const incrementProfileClickCount = async (postId) => recordOpinAction(postId, 'open_profile');

export const toggleLike = async (postId) => {
  const user = await getAuthUser();
  const client = ensureClient();
  const { data: existing, error: lookupError } = await client.from('opin_likes').select('post_id').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
  if (lookupError) throw lookupError;
  let liked;
  if (existing) {
    const { error } = await client.from('opin_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    if (error) throw error;
    liked = false;
  } else {
    const { error } = await client.from('opin_likes').insert({ post_id: postId, user_id: user.id });
    if (error) throw error;
    liked = true;
  }
  const { count, error: countError } = await client.from('opin_likes').select('*', { count: 'exact', head: true }).eq('post_id', postId);
  if (countError) throw countError;
  return { liked, likeCount: count || 0 };
};

export const toggleReaction = async (postId, reaction) => {
  const user = await getAuthUser();
  const safeReaction = String(reaction || '').trim().slice(0, 40);
  if (!safeReaction) throw new Error('INVALID_REACTION');
  const client = ensureClient();
  const { data: existing, error: lookupError } = await client.from('opin_reactions').select('reaction').eq('post_id', postId).eq('user_id', user.id).eq('reaction', safeReaction).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    const { error } = await client.from('opin_reactions').delete().eq('post_id', postId).eq('user_id', user.id).eq('reaction', safeReaction);
    if (error) throw error;
  } else {
    const { error } = await client.from('opin_reactions').insert({ post_id: postId, user_id: user.id, reaction: safeReaction });
    if (error) throw error;
  }
  const { data, error } = await client.from('opin_reactions').select('reaction').eq('post_id', postId);
  if (error) throw error;
  const counts = {};
  (data || []).forEach(({ reaction: key }) => { counts[key] = (counts[key] || 0) + 1; });
  return { reactionCounts: counts, reacted: !existing };
};

export const addComment = async (postId, commentText) => {
  const user = await getAuthUser();
  const content = String(commentText || '').trim();
  if (!content || content.length > MAX_COMMENT_LENGTH) throw new Error('INVALID_COMMENT');
  if (/(https?:\/\/|www\.|wa\.me|t\.me|whatsapp|telegram|instagram|facebook|discord)/i.test(content)) throw new Error('No publiques datos de contacto externo.');
  const client = ensureClient();
  const { data, error } = await client.from('opin_comments').insert({ post_id: postId, author_id: user.id, content }).select('*').single();
  if (error) throw error;
  const profiles = await fetchProfiles([user.id]);
  return { id: data.id, postId, userId: user.id, username: profiles.get(user.id)?.username || 'Usuario', avatar: profiles.get(user.id)?.avatar_url || '', text: content, content, createdAt: data.created_at, status: data.status };
};

export const getPostComments = async (postId, limitCount = 100) => {
  const client = ensureClient();
  const { data, error } = await client.from('opin_comments').select('*').eq('post_id', postId).eq('status', 'active').is('deleted_at', null).order('created_at', { ascending: false }).limit(Math.min(Number(limitCount) || 100, 100));
  if (error) throw error;
  const profiles = await fetchProfiles((data || []).map((row) => row.author_id));
  return (data || []).map((row) => ({ id: row.id, postId: row.post_id, userId: row.author_id, username: profiles.get(row.author_id)?.username || 'Usuario', avatar: profiles.get(row.author_id)?.avatar_url || '', text: row.content, content: row.content, createdAt: row.created_at, status: row.status })).reverse();
};

export const deleteComment = async (commentId) => {
  const user = await getAuthUser();
  const client = ensureClient();
  const { error } = await client.from('opin_comments').update({ status: 'deleted', deleted_at: new Date().toISOString() }).eq('id', commentId).eq('author_id', user.id);
  if (error) throw error;
  return true;
};

export const getReplyPreview = async (postId, limitCount = 3) => getPostComments(postId, limitCount);
export const getRecentReplyPreview = async (postId, limitCount = 6) => getPostComments(postId, limitCount);
export const getTotalReactionCount = (post) => Object.values(post?.reactionCounts || {}).reduce((sum, count) => sum + Number(count || 0), 0);
export const hasUserLiked = (post, userId) => Boolean(userId && Array.isArray(post?.likedBy) && post.likedBy.includes(userId));
export const hasUserReacted = (post, reaction, userId) => Boolean(userId && post?.reactions?.[reaction]?.includes?.(userId));
export const getUserReactions = (post) => post?.reactions || {};
export const getStableOpinPosts = async () => [];
export const createStableOpinPost = async () => { throw new Error('STABLE_POSTS_SERVER_ONLY'); };
export const updateStableOpinPost = async () => { throw new Error('STABLE_POSTS_SERVER_ONLY'); };
export const deleteStableOpinPost = async () => { throw new Error('STABLE_POSTS_SERVER_ONLY'); };
export const seedStableOpinExamples = async () => ({ success: false, skipped: true, reason: 'NO_SYNTHETIC_CONTENT' });
export const addAdminReply = async () => { throw new Error('ADMIN_REPLY_SERVER_ONLY'); };
export const getOpinPostsForAdmin = async (limitCount = 100) => getOpinFeed(limitCount);
export const getPersistedFollowedOpinPostIds = async () => [];
export const savePersistedFollowedOpinPostIds = async () => false;
export const canViewAllReplies = () => false;

export default {
  canCreatePost,
  createOpinPost,
  getOpinPostsByUserId,
  getOpinFeed,
  incrementViewCount,
  incrementProfileClickCount,
  editOpinPost,
  deleteOpinPost,
  getMyOpinPosts,
  getOpinPostsByUserId,
  getMyActiveOpinIntent,
  getOpenOpinIntentsByUserIds,
  getOpinPostById,
  updateOpinStatus,
  toggleLike,
  toggleReaction,
  addComment,
  getPostComments,
  deleteComment,
  getReplyPreview,
  getRecentReplyPreview,
};
