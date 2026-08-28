import { supabase } from '@/config/supabase';
import { refreshSignedMediaUrl } from '@/services/supabaseMediaService';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_SIZE = 140 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const DEFAULT_REACTION_COUNTS = { like: 0, dislike: 0, fire: 0, heart: 0, devil: 0 };

const ensureClient = () => {
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
};

const normalizeReplyTo = (value) => {
  if (!value || typeof value !== 'object') return null;
  const messageId = String(value.messageId || value.id || '').trim();
  if (!messageId) return null;
  return {
    messageId: messageId.slice(0, 120),
    username: String(value.username || 'Usuario').slice(0, 80),
    content: String(value.content || '').slice(0, 500),
    type: String(value.type || 'text').slice(0, 20),
  };
};

const normalizeReactionCounts = (rows = []) => {
  const counts = { ...DEFAULT_REACTION_COUNTS };
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    const reaction = String(row?.reaction || '').trim();
    if (!reaction) return;
    counts[reaction] = (counts[reaction] || 0) + 1;
  });
  return counts;
};

const normalizeMessage = (row = {}) => {
  const author = row.author || row.profiles || {};
  const mediaPath = row.media_path || null;
  const mediaBucket = row.media_bucket || null;
  const timestamp = row.created_at || row.timestamp || new Date().toISOString();
  return {
    id: row.id,
    roomId: row.room_id,
    room_id: row.room_id,
    userId: row.author_id || row.user_id || null,
    user_id: row.author_id || row.user_id || null,
    senderUid: row.author_id || row.user_id || null,
    sender_uid: row.author_id || row.user_id || null,
    username: author.username || row.username || 'Usuario',
    avatar: author.avatar_url || row.avatar || null,
    content: row.content || '',
    type: row.message_type || row.type || 'text',
    messageType: row.message_type || row.type || 'text',
    mediaPath,
    mediaBucket,
    mediaMime: row.media_mime || null,
    mediaSize: row.media_size || null,
    timestamp,
    timestampMs: new Date(timestamp).getTime(),
    createdAt: timestamp,
    editedAt: row.edited_at || null,
    deletedAt: row.deleted_at || null,
    replyTo: normalizeReplyTo(row.reply_to || row.replyTo),
    reactions: normalizeReactionCounts(row.reactions || []),
  };
};

const hydrateMessageReactions = async (messages = []) => {
  const list = Array.isArray(messages) ? messages : [];
  const ids = [...new Set(list.map((message) => message?.id).filter(Boolean))];
  if (!ids.length) return list;
  const client = ensureClient();
  const { data, error } = await client
    .from('message_reactions')
    .select('message_id, reaction')
    .in('message_id', ids);
  if (error) throw error;
  const byMessage = new Map();
  (data || []).forEach((row) => {
    const rows = byMessage.get(row.message_id) || [];
    rows.push(row);
    byMessage.set(row.message_id, rows);
  });
  return list.map((message) => ({
    ...message,
    reactions: normalizeReactionCounts(byMessage.get(message.id) || []),
  }));
};

const hydrateMessageMediaUrl = async (message) => {
  if (!message || message.type !== 'image' || !message.mediaPath || !message.mediaBucket) return message;
  try {
    const url = await refreshSignedMediaUrl(message.mediaBucket, message.mediaPath, 60 * 60);
    return url ? { ...message, content: url } : message;
  } catch {
    return message;
  }
};

const validateMessagePayload = (messageData = {}) => {
  const content = String(messageData.content ?? '').trim();
  const type = messageData.type === 'image' ? 'image' : 'text';
  if (type === 'text' && (!content || content.length > MAX_MESSAGE_LENGTH)) {
    throw new Error('INVALID_MESSAGE_CONTENT');
  }
  if (type === 'image') {
    const media = Array.isArray(messageData.media) ? messageData.media[0] : (messageData.media || {});
    const mime = String(messageData.mediaMime || messageData.mimeType || media.mediaMime || media.mimeType || media.contentType || '').toLowerCase();
    const size = Number(messageData.mediaSize || messageData.size || media.mediaSize || media.size || media.sizeBytes || 0);
    const path = String(messageData.mediaPath || messageData.path || media.mediaPath || media.path || '').trim();
    const bucket = String(messageData.mediaBucket || messageData.bucket || media.mediaBucket || media.bucket || 'chat-public').trim();
    if (!path || !ALLOWED_IMAGE_TYPES.has(mime) || !Number.isInteger(size) || size < 1 || size > MAX_IMAGE_SIZE) {
      throw new Error('INVALID_CHAT_IMAGE');
    }
    return {
      content: 'Imagen',
      message_type: 'image',
      media_path: path.slice(0, 500),
      media_bucket: bucket.slice(0, 80),
      media_mime: mime,
      media_size: size,
      reply_to: normalizeReplyTo(messageData.replyTo || messageData.reply_to),
    };
  }
  return {
    content,
    message_type: 'text',
    media_path: null,
    media_bucket: null,
    media_mime: null,
    media_size: null,
    reply_to: normalizeReplyTo(messageData.replyTo || messageData.reply_to),
  };
};

const getCurrentUser = async () => {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  return data.user;
};

const selectMessage = '*, author:profiles(id, username, avatar_url)';

export const sendMessage = async (roomId, messageData = {}) => {
  try {
    const client = ensureClient();
    const user = await getCurrentUser();
    if (!user?.id) throw new Error('NOT_AUTHENTICATED');
    const safeRoomId = String(roomId || '').trim().slice(0, 80);
    if (!safeRoomId) throw new Error('INVALID_ROOM');
    const payload = validateMessagePayload(messageData);
    const clientId = String(messageData.clientId || messageData.id || crypto.randomUUID()).slice(0, 160);

    const { data, error } = await client
      .from('messages')
      .insert({
        room_id: safeRoomId,
        author_id: user.id,
        client_id: clientId,
        ...payload,
      })
      .select(selectMessage)
      .single();
    if (error) throw error;
    return { message: await hydrateMessageMediaUrl(normalizeMessage(data)), error: null };
  } catch (error) {
    return { message: null, error };
  }
};

const removeMediaAssets = async (assets = []) => {
  const client = ensureClient();
  const grouped = new Map();
  (Array.isArray(assets) ? assets : []).forEach((asset) => {
    if (!asset?.bucket || !asset?.path) return;
    const paths = grouped.get(asset.bucket) || [];
    paths.push(asset.path);
    grouped.set(asset.bucket, paths);
  });
  await Promise.all([...grouped.entries()].map(([bucket, paths]) => client.storage.from(bucket).remove(paths).catch(() => null)));
};

export const deleteMessageWithMedia = async (roomId, messageId, options = {}) => {
  const client = ensureClient();
  const user = await getCurrentUser();
  if (!user?.id || !messageId) throw new Error('INVALID_MESSAGE_DELETE');
  if (options?.isAdmin) {
    const { data, error } = await client.rpc('admin_delete_public_message', { target_room_id: String(roomId || '').trim(), target_message_id: messageId });
    if (error) throw error;
    await removeMediaAssets(data?.media || []);
    return { success: true, deletedCount: Number(data?.deletedCount || 0) };
  }
  const { data: message, error: readError } = await client.from('messages').select('id, author_id, media_path, media_bucket').eq('id', messageId).eq('room_id', String(roomId || '').trim()).maybeSingle();
  if (readError) throw readError;
  if (!message || message.author_id !== user.id) throw new Error('MESSAGE_DELETE_FORBIDDEN');
  const { error } = await client.from('messages').update({ deleted_at: new Date().toISOString() }).eq('id', messageId).eq('author_id', user.id);
  if (error) throw error;
  if (message.media_path && message.media_bucket) await client.storage.from(message.media_bucket).remove([message.media_path]).catch(() => {});
  return { success: true };
};

export const deleteMessagesByUser = async (roomId, targetUserId, options = {}) => {
  const client = ensureClient();
  if (!options?.isAdmin) throw new Error('ADMIN_REQUIRED');
  const { data, error } = await client.rpc('admin_delete_public_messages', { target_room_id: String(roomId || '').trim(), target_user_id: targetUserId, include_system: false });
  if (error) throw error;
  await removeMediaAssets(data?.media || []);
  return { success: true, deletedCount: Number(data?.deletedCount || 0) };
};

export const deleteAllMessages = async (roomId, options = {}) => {
  const client = ensureClient();
  if (!options?.isAdmin) throw new Error('ADMIN_REQUIRED');
  const { data, error } = await client.rpc('admin_delete_public_messages', { target_room_id: String(roomId || '').trim(), target_user_id: null, include_system: Boolean(options?.includeSystem) });
  if (error) throw error;
  await removeMediaAssets(data?.media || []);
  return { success: true, deletedCount: Number(data?.deletedCount || 0) };
};

export const getRoomMessages = async (roomId, limit = 50) => {
  try {
    const client = ensureClient();
    const safeLimit = Math.max(1, Math.min(Number(limit) || 50, 100));
    const { data, error } = await client
      .from('messages')
      .select(selectMessage)
      .eq('room_id', String(roomId || '').trim())
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(safeLimit);
    if (error) throw error;
    const messages = await Promise.all((data || []).map((row) => hydrateMessageMediaUrl(normalizeMessage(row))));
    const hydrated = await hydrateMessageReactions(messages);
    return { messages: hydrated.reverse(), error: null };
  } catch (error) {
    return { messages: [], error };
  }
};

export const subscribeToRoomMessages = (roomId, callback) => {
  let client;
  try {
    client = ensureClient();
  } catch {
    callback?.([]);
    return () => {};
  }

  let active = true;
  let currentMessages = [];
  const publish = () => {
    if (active) callback?.([...currentMessages]);
  };
  getRoomMessages(roomId, 100).then(({ messages }) => {
    if (!active) return;
    currentMessages = messages || [];
    publish();
  }).catch(() => {
    if (active) {
      currentMessages = [];
      publish();
    }
  });

  const channel = client
    .channel(`supabase:room:${roomId}:messages`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${String(roomId || '').trim()}`,
    }, async (payload) => {
      if (!active) return;
      let row = payload.new;
      try {
        const { data } = await client.from('messages').select(selectMessage).eq('id', payload.new.id).maybeSingle();
        row = data || row;
      } catch {
        // El evento sigue siendo válido aunque la hidratación del autor falle.
      }
      const nextMessage = (await hydrateMessageReactions([await hydrateMessageMediaUrl(normalizeMessage(row))]))[0];
      currentMessages = [...currentMessages.filter((item) => item.id !== nextMessage.id), nextMessage]
        .sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0))
        .slice(-100);
      publish();
    })
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'messages',
      filter: `room_id=eq.${String(roomId || '').trim()}`,
    }, (payload) => {
      if (active) {
          Promise.resolve(hydrateMessageMediaUrl(normalizeMessage(payload.new)))
            .then((updated) => hydrateMessageReactions([updated]))
            .then(([hydrated]) => {
              if (!active) return;
              currentMessages = currentMessages.map((item) => item.id === hydrated.id ? hydrated : item);
              publish();
            });
      }
    })
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'message_reactions',
    }, async (payload) => {
      if (!active || !payload?.new?.message_id && !payload?.old?.message_id) return;
      const messageId = payload.new?.message_id || payload.old?.message_id;
      const current = currentMessages.find((item) => item.id === messageId);
      if (!current) return;
      try {
        const [hydrated] = await hydrateMessageReactions([current]);
        if (!active) return;
        currentMessages = currentMessages.map((item) => item.id === messageId ? hydrated : item);
        publish();
      } catch {
        // Un fallo de hidratación no debe derribar la suscripción del chat.
      }
    })
    .subscribe();

  return () => {
    active = false;
    client.removeChannel(channel);
  };
};

export const toggleMessageReaction = async (roomId, messageId, reaction) => {
  const client = ensureClient();
  const user = await getCurrentUser();
  const safeReaction = String(reaction || '').trim().slice(0, 40);
  if (!user?.id || !messageId || !safeReaction) throw new Error('INVALID_REACTION');
  const { data: existing, error: lookupError } = await client.from('message_reactions').select('reaction').eq('message_id', messageId).eq('user_id', user.id).eq('reaction', safeReaction).maybeSingle();
  if (lookupError) throw lookupError;
  if (existing) {
    const { error } = await client.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', user.id).eq('reaction', safeReaction);
    if (error) throw error;
  } else {
    const { error } = await client.from('message_reactions').insert({ message_id: messageId, user_id: user.id, reaction: safeReaction });
    if (error) throw error;
  }
  const { data: rows, error } = await client.from('message_reactions').select('reaction').eq('message_id', messageId);
  if (error) throw error;
  const counts = {};
  (rows || []).forEach((row) => { counts[row.reaction] = (counts[row.reaction] || 0) + 1; });
  return { success: true, reacted: !existing, reactionCounts: counts };
};

export const markMessagesAsRead = async (roomId, currentUserId) => {
  const client = ensureClient();
  const user = await getCurrentUser();
  if (!user?.id || (currentUserId && currentUserId !== user.id)) throw new Error('AUTH_USER_MISMATCH');
  const { data: messages, error: messageError } = await client.from('messages').select('id').eq('room_id', String(roomId || '').trim()).neq('author_id', user.id).is('deleted_at', null).limit(100);
  if (messageError) throw messageError;
  const updates = (messages || []).map((message) => ({ message_id: message.id, user_id: user.id, delivered_at: new Date().toISOString(), read_at: new Date().toISOString() }));
  if (!updates.length) return { success: true, updated: 0 };
  const { error } = await client.from('message_receipts').upsert(updates, { onConflict: 'message_id,user_id' });
  if (error) throw error;
  return { success: true, updated: updates.length };
};

export const deleteMessage = async (messageId) => {
  try {
    const client = ensureClient();
    const user = await getCurrentUser();
    if (!user?.id) throw new Error('NOT_AUTHENTICATED');
    const { error } = await client
      .from('messages')
      .update({ deleted_at: new Date().toISOString(), content: '[Mensaje eliminado]' })
      .eq('id', messageId)
      .eq('author_id', user.id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

export const updateMessage = async (messageId, updates = {}) => {
  try {
    const client = ensureClient();
    const user = await getCurrentUser();
    if (!user?.id) throw new Error('NOT_AUTHENTICATED');
    const content = String(updates.content ?? '').trim();
    if (!content || content.length > MAX_MESSAGE_LENGTH) throw new Error('INVALID_MESSAGE_CONTENT');
    const { data, error } = await client
      .from('messages')
      .update({ content, edited_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('author_id', user.id)
      .select(selectMessage)
      .single();
    if (error) throw error;
    return { message: await hydrateMessageMediaUrl(normalizeMessage(data)), error: null };
  } catch (error) {
    return { message: null, error };
  }
};

export default {
  deleteMessageWithMedia,
  sendMessage,
  subscribeToRoomMessages,
  getRoomMessages,
  deleteMessage,
  updateMessage,
  toggleMessageReaction,
  markMessagesAsRead,
  deleteMessagesByUser,
  deleteAllMessages,
};
