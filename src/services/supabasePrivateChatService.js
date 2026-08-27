import { supabase } from '@/config/supabase';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_IMAGE_SIZE = 140 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

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

const assertActor = async (requestedId = null) => {
  const user = await getCurrentUser();
  if (requestedId && requestedId !== user.id) throw new Error('AUTH_USER_MISMATCH');
  return user;
};

const directKeyFor = (firstId, secondId) => [firstId, secondId].sort().join(':');
const normalizeList = (value) => Array.isArray(value) ? value.filter(Boolean) : [];
const normalizeReplyTo = (value) => {
  if (!value || typeof value !== 'object') return null;
  const messageId = String(value.messageId || value.id || '').trim();
  if (!messageId) return null;
  return { messageId: messageId.slice(0, 120), username: String(value.username || 'Usuario').slice(0, 80), content: String(value.content || '').slice(0, 500), type: String(value.type || 'text').slice(0, 20) };
};
const getReceiptState = (receiptRows = []) => {
  const rows = Array.isArray(receiptRows) ? receiptRows : (receiptRows && receiptRows.user_id ? [receiptRows] : []);
  const deliveredTo = [...new Set(rows.filter((receipt) => receipt?.delivered_at).map((receipt) => receipt.user_id).filter(Boolean))];
  const readBy = [...new Set(rows.filter((receipt) => receipt?.read_at).map((receipt) => receipt.user_id).filter(Boolean))];
  return {
    status: readBy.length ? 'read' : (deliveredTo.length ? 'delivered' : 'sent'),
    deliveredAt: rows.find((receipt) => receipt?.delivered_at)?.delivered_at || null,
    readAt: rows.find((receipt) => receipt?.read_at)?.read_at || null,
    deliveredTo,
    readBy,
  };
};

const mapMessage = (row = {}, profile = {}, receipt = [], mediaUrl = null) => ({
  id: row.id,
  clientId: row.client_id || null,
  userId: row.sender_id,
  senderUid: row.sender_id,
  username: profile.username || 'Usuario',
  avatar: profile.avatar_url || '',
  content: mediaUrl || row.content || '',
  type: row.message_type || 'text',
  messageType: row.message_type || 'text',
  media: row.media_path ? [{ path: row.media_path, bucket: row.media_bucket, mimeType: row.media_mime, size: row.media_size }] : [],
  mediaPath: row.media_path || null,
  mediaBucket: row.media_bucket || null,
  mediaMime: row.media_mime || null,
  mediaSize: row.media_size || null,
  timestamp: row.created_at,
  createdAt: row.created_at,
  timestampMs: row.created_at ? new Date(row.created_at).getTime() : 0,
  editedAt: row.edited_at || null,
  deletedAt: row.deleted_at || null,
  ...getReceiptState(receipt),
  replyTo: normalizeReplyTo(row.reply_to || row.replyTo),
});

const mapConversation = (row = {}, members = []) => ({
  id: row.id,
  chatId: row.id,
  participants: members.map((member) => member.user_id),
  participantIds: members.map((member) => member.user_id),
  participantProfiles: members.map((member) => member.profile || { userId: member.user_id }),
  title: row.title || '',
  active: true,
  status: 'active',
  lastMessage: row.last_message_preview || null,
  lastMessageType: row.last_message_type || null,
  lastMessageSenderId: row.last_message_sender_id || null,
  lastMessageAt: row.last_message_at || null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const fetchMembers = async (conversationId) => {
  const client = ensureClient();
  const { data, error } = await client.from('conversation_members').select('conversation_id, user_id, member_role, joined_at, last_read_at').eq('conversation_id', conversationId).is('left_at', null);
  if (error) throw error;
  const ids = (data || []).map((member) => member.user_id);
  const { data: profiles, error: profileError } = ids.length ? await client.from('profiles').select('id, username, avatar_url, is_premium, profile_role, comuna').in('id', ids) : { data: [], error: null };
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  return (data || []).map((member) => ({ ...member, profile: { userId: member.user_id, ...profileMap.get(member.user_id) } }));
};

const fetchMessages = async (conversationId, limitCount = 80, beforeIso = null) => {
  const client = ensureClient();
  const safeLimit = Math.max(1, Math.min(Number(limitCount) || 80, 100));
  let query = client.from('private_messages').select('*').eq('conversation_id', conversationId).is('deleted_at', null);
  if (beforeIso) query = query.lt('created_at', beforeIso);
  const { data, error } = await query.order('created_at', { ascending: false }).limit(safeLimit);
  if (error) throw error;
  const rows = data || [];
  const ids = [...new Set(rows.map((row) => row.sender_id))];
  const { data: profiles, error: profileError } = ids.length ? await client.from('profiles').select('id, username, avatar_url').in('id', ids) : { data: [], error: null };
  if (profileError) throw profileError;
  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const messageIds = rows.map((row) => row.id);
  const { data: receipts, error: receiptError } = messageIds.length ? await client.from('private_message_receipts').select('*').in('private_message_id', messageIds) : { data: [], error: null };
  if (receiptError) throw receiptError;
  const receiptMap = new Map();
  (receipts || []).forEach((receipt) => {
    const rowsForMessage = receiptMap.get(receipt.private_message_id) || [];
    rowsForMessage.push({ ...receipt, message_id: receipt.private_message_id });
    receiptMap.set(receipt.private_message_id, rowsForMessage);
  });
  const mapped = await Promise.all(rows.map(async (row) => {
    let mediaUrl = null;
    if (row.message_type === 'image' && row.media_path && row.media_bucket) {
      const signed = await client.storage.from(row.media_bucket).createSignedUrl(row.media_path, 60 * 60).catch(() => ({ data: null }));
      mediaUrl = signed?.data?.signedUrl || null;
    }
    return mapMessage(row, profileMap.get(row.sender_id), receiptMap.get(row.id) || [], mediaUrl);
  }));
  return mapped.reverse();
};

const assertNotBlocked = async (firstId, secondId) => {
  const client = ensureClient();
  const { data, error } = await client.from('blocks').select('blocker_id').or(`and(blocker_id.eq.${firstId},blocked_id.eq.${secondId}),and(blocker_id.eq.${secondId},blocked_id.eq.${firstId})`).limit(1);
  if (error) throw error;
  if (data?.length) throw new Error('BLOCKED');
};

export const getOrCreatePrivateChat = async (userAId, userBId) => {
  const actor = await assertActor(userAId);
  if (!userBId || actor.id === userBId) throw new Error('SELF_CHAT_NOT_ALLOWED');
  const client = ensureClient();
  const { data, error } = await client.rpc('get_or_create_direct_conversation', { target_user_id: userBId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.conversation_id) throw new Error('CONVERSATION_CREATE_FAILED');
  return { chatId: row.conversation_id, created: Boolean(row.created) };
};

const validateMessage = (payload = {}) => {
  const { type = 'text', content = '', media = [], clientId = null } = payload;
  const normalizedType = type === 'image' ? 'image' : 'text';
  const normalizedContent = String(content ?? '').trim();
  if (normalizedType === 'text' && (!normalizedContent || normalizedContent.length > MAX_MESSAGE_LENGTH)) throw new Error('INVALID_MESSAGE_CONTENT');
  const firstMedia = Array.isArray(media) ? media[0] : null;
  if (normalizedType === 'image') {
    const mime = String(firstMedia?.mimeType || firstMedia?.mime || '').toLowerCase();
    const size = Number(firstMedia?.size || 0);
    const path = String(firstMedia?.path || firstMedia?.fullPath || '').trim();
    const bucket = String(firstMedia?.bucket || 'chat-private').trim();
    if (!path || !ALLOWED_IMAGE_TYPES.has(mime) || !Number.isInteger(size) || size < 1 || size > MAX_IMAGE_SIZE) throw new Error('INVALID_PRIVATE_IMAGE');
    return { content: normalizedContent || 'Imagen', message_type: 'image', media_path: path.slice(0, 500), media_bucket: bucket.slice(0, 80), media_mime: mime, media_size: size, reply_to: normalizeReplyTo(payload.replyTo || payload.reply_to) };
  }
  return { content: normalizedContent, message_type: 'text', media_path: null, media_bucket: null, media_mime: null, media_size: null, reply_to: normalizeReplyTo(payload.replyTo || payload.reply_to) };
};

export const sendRichPrivateChatMessage = async (chatId, payload = {}) => {
  const actor = await assertActor(payload.userId);
  const client = ensureClient();
  const messagePayload = validateMessage(payload);
  const clientId = String(payload.clientId || crypto.randomUUID()).slice(0, 160);
  const { data: rpcData, error: rpcError } = await client.rpc('send_private_message', {
    target_conversation_id: chatId,
    target_client_id: clientId,
    target_content: messagePayload.content,
    target_message_type: messagePayload.message_type,
    target_media_path: messagePayload.media_path,
    target_media_bucket: messagePayload.media_bucket,
    target_media_mime: messagePayload.media_mime,
    target_media_size: messagePayload.media_size,
    target_reply_to: messagePayload.reply_to,
  });
  if (rpcError) throw rpcError;
  const result = Array.isArray(rpcData) ? rpcData[0] : rpcData;
  if (!result?.message_id) throw new Error('MESSAGE_INSERT_FAILED');
  const messages = await fetchMessages(chatId, 1);
  const message = messages.find((item) => item.id === result.message_id) || null;
  return { id: result.message_id, clientId: result.client_id || clientId, message };
};

export const sendMessageToPrivateChat = async (chatId, payload = {}) => sendRichPrivateChatMessage(chatId, { ...payload, type: 'text', media: [] });

export const getPrivateChatMessagesBefore = async (chatId, beforeIso, limitCount = 40) => fetchMessages(chatId, limitCount, beforeIso);

export const getPrivateChatConversation = async (chatId) => {
  const client = ensureClient();
  const { data, error } = await client.from('conversations').select('*').eq('id', chatId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const members = await fetchMembers(chatId);
  return mapConversation(data, members);
};

export const subscribeToPrivateChatMessages = (chatId, callback, limitCount = 80) => {
  let client;
  try { client = ensureClient(); } catch { callback?.([]); return () => {}; }
  let active = true;
  let current = [];
  const publish = () => { if (active) callback?.([...current]); };
  fetchMessages(chatId, limitCount).then((messages) => { if (active) { current = messages; publish(); } }).catch(() => { if (active) { current = []; publish(); } });
  const channel = client.channel(`private-chat:${chatId}:messages`).on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages', filter: `conversation_id=eq.${chatId}` }, async (payload) => {
    if (!active) return;
    let row = payload.new || payload.old;
    if (!row?.id) return;
    if (payload.eventType === 'DELETE') {
      current = current.filter((item) => item.id !== row.id);
      publish();
      return;
    }
    try { const { data } = await client.from('private_messages').select('*').eq('id', row.id).maybeSingle(); row = data || row; } catch {}
    const members = await fetchMembers(chatId).catch(() => []);
    const profile = members.find((member) => member.user_id === row.sender_id)?.profile || {};
    let mediaUrl = null;
    if (row.message_type === 'image' && row.media_path && row.media_bucket) {
      const signed = await client.storage.from(row.media_bucket).createSignedUrl(row.media_path, 60 * 60).catch(() => ({ data: null }));
      mediaUrl = signed?.data?.signedUrl || null;
    }
    const { data: receipts } = await client.from('private_message_receipts').select('*').eq('private_message_id', row.id);
    const next = mapMessage(row, profile, receipts || [], mediaUrl);
    current = [...current.filter((item) => item.id !== next.id), next].sort((a, b) => (a.timestampMs || 0) - (b.timestampMs || 0)).slice(-Math.max(1, Math.min(Number(limitCount) || 80, 100)));
    publish();
  }).on('postgres_changes', { event: '*', schema: 'public', table: 'private_message_receipts' }, async (payload) => {
    if (!active) return;
    const messageId = payload.new?.private_message_id || payload.old?.private_message_id;
    const existing = current.find((item) => item.id === messageId);
    if (!existing) return;
    const { data: receipts } = await client.from('private_message_receipts').select('*').eq('private_message_id', messageId);
    if (!active) return;
    current = current.map((item) => item.id === messageId ? { ...item, ...getReceiptState(receipts || []) } : item);
    publish();
  }).subscribe();
  return () => { active = false; client.removeChannel(channel); };
};

export const markIncomingMessagesStatus = async (chatId, messages = [], { markRead = false } = {}) => {
  const actor = await getCurrentUser();
  const client = ensureClient();
  const updates = normalizeList(messages).filter((message) => message?.id && message.userId !== actor.id && message.type !== 'system').map((message) => ({ message_id: message.id, user_id: actor.id, delivered_at: new Date().toISOString(), ...(markRead ? { read_at: new Date().toISOString() } : {}) }));
  if (!updates.length) return { success: true, updated: 0 };
  const { error } = await client.rpc('mark_private_message_receipts', {
    target_conversation_id: chatId,
    target_message_ids: updates.map((item) => item.message_id),
    mark_read: Boolean(markRead),
  });
  if (error) throw error;
  return { success: true, updated: updates.length };
};

export const updatePrivateChatTypingStatus = async (chatId, userId, isTyping, username = '') => {
  const actor = await assertActor(userId);
  const client = ensureClient();
  if (!isTyping) {
    const { error } = await client.from('private_typing').delete().eq('conversation_id', chatId).eq('user_id', actor.id);
    if (error) throw error;
    return { success: true };
  }
  const { error } = await client.from('private_typing').upsert({ conversation_id: chatId, user_id: actor.id, username: String(username || '').slice(0, 80), updated_at: new Date().toISOString() }, { onConflict: 'conversation_id,user_id' });
  if (error) throw error;
  return { success: true };
};

export const subscribeToPrivateChatTyping = (chatId, currentUserId, callback) => {
  let client;
  try { client = ensureClient(); } catch { callback?.([]); return () => {}; }
  let active = true;
  const load = async () => {
    const { data } = await client.from('private_typing').select('user_id, username, updated_at').eq('conversation_id', chatId).neq('user_id', currentUserId);
    if (active) callback?.(data || []);
  };
  load();
  const channel = client.channel(`private-chat:${chatId}:typing`).on('postgres_changes', { event: '*', schema: 'public', table: 'private_typing', filter: `conversation_id=eq.${chatId}` }, load).subscribe();
  return () => { active = false; client.removeChannel(channel); };
};

export const sendPrivateChatRequest = async (fromUserId, toUserId, options = {}) => {
  const actor = await assertActor(fromUserId);
  if (!toUserId || actor.id === toUserId) throw new Error('SELF_REQUEST_NOT_ALLOWED');
  await assertNotBlocked(actor.id, toUserId);
  const client = ensureClient();
  const { data, error } = await client.rpc('send_private_request', { target_user_id: toUserId, request_message: String(options.message || '').trim().slice(0, 500) || null });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.request_id) throw new Error('REQUEST_CREATE_FAILED');
  return { success: true, requestId: row.request_id, created: Boolean(row.created) };
};

export const respondToPrivateChatRequest = async (userId, requestId, accepted) => {
  await assertActor(userId);
  const targetRequestId = String(requestId || '').trim();
  if (!targetRequestId) throw new Error('INVALID_REQUEST_ID');
  const client = ensureClient();
  const { data, error } = await client.rpc('respond_private_request', { target_request_id: targetRequestId, accept_request: Boolean(accepted) });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { success: true, accepted: Boolean(row?.accepted), chatId: row?.conversation_id || null };
};

export const sendDirectMessage = async (fromUserId, toUserId, content) => {
  const chat = await getOrCreatePrivateChat(fromUserId, toUserId);
  await sendMessageToPrivateChat(chat.chatId, { userId: fromUserId, content });
  return { success: true, chatId: chat.chatId };
};

const mapNotification = (row = {}, actor = {}, context = {}) => {
  const rawType = String(row.type || '').trim();
  const isRequest = row.entity_type === 'private_request' || rawType === 'private_request' || rawType === 'private_chat_request';
  const isAccepted = rawType === 'private_request_accepted' || rawType === 'private_chat_accepted';
  const isRejected = rawType === 'private_request_rejected' || rawType === 'private_chat_rejected';
  const type = isRequest ? 'private_chat_request' : (isAccepted ? 'private_chat_accepted' : (isRejected ? 'private_chat_rejected' : (rawType === 'private_message' ? 'direct_message' : rawType)));
  const actorId = actor.id || row.actor_id || null;
  return {
    ...row,
    type,
    id: row.id,
    notificationId: row.id,
    requestId: isRequest ? (row.entity_id || null) : null,
    chatId: context.chatId || (row.entity_type === 'conversation' ? (row.entity_id || null) : null),
    from: actorId,
    fromUsername: actor.username || 'Usuario',
    fromAvatar: actor.avatar_url || '',
    fromIsPremium: Boolean(actor.is_premium),
    fromVerified: Boolean(actor.verified),
    fromRole: actor.role || actor.profile_role || 'user',
    status: isRequest ? 'pending' : (row.status || null),
    read: Boolean(row.read_at),
    timestamp: row.created_at,
    createdAt: row.created_at,
    source: row.source || 'supabase',
    content: row.content || '',
    ...(context.requestStatus ? { status: context.requestStatus } : {}),
  };
};

export const subscribeToNotifications = (userId, callback) => {
  let client;
  try { client = ensureClient(); } catch { callback?.([]); return () => {}; }
  let active = true;
  const load = async () => {
    const { data: rows, error } = await client.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
    if (error) { if (active) callback?.([]); return; }
    const actorIds = [...new Set((rows || []).map((row) => row.actor_id).filter(Boolean))];
    const messageIds = [...new Set((rows || []).filter((row) => row.entity_type === 'private_message').map((row) => row.entity_id).filter(Boolean))];
    const requestIds = [...new Set((rows || []).filter((row) => row.entity_type === 'private_request').map((row) => row.entity_id).filter(Boolean))];
    const [{ data: actors }, { data: privateMessages }, { data: privateRequests }] = await Promise.all([
      actorIds.length
        ? client.from('profiles').select('id, username, avatar_url, is_premium, verified, role, profile_role').in('id', actorIds)
        : Promise.resolve({ data: [] }),
      messageIds.length
        ? client.from('private_messages').select('id, conversation_id').in('id', messageIds)
        : Promise.resolve({ data: [] }),
      requestIds.length
        ? client.from('private_requests').select('id, status, conversation_id').in('id', requestIds)
        : Promise.resolve({ data: [] }),
    ]);
    const actorMap = new Map((actors || []).map((actor) => [actor.id, actor]));
    const conversationByMessage = new Map((privateMessages || []).map((message) => [message.id, message.conversation_id]));
    const requestMap = new Map((privateRequests || []).map((request) => [request.id, request]));
    if (active) callback?.((rows || []).map((row) => {
      const request = row.entity_type === 'private_request' ? requestMap.get(row.entity_id) : null;
      return mapNotification(row, actorMap.get(row.actor_id) || {}, {
        chatId: conversationByMessage.get(row.entity_id) || request?.conversation_id || null,
        requestStatus: request?.status || null,
      });
    }));
  };
  load();
  const channel = client.channel(`notifications:${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, load).subscribe();
  return () => { active = false; client.removeChannel(channel); };
};

export const subscribeToPrivateInbox = (userId, callback) => {
  let client;
  try { client = ensureClient(); } catch { callback?.([]); return () => {}; }
  let active = true;
  const load = async () => {
    const { data: memberships } = await client.from('conversation_members').select('conversation_id, user_id, last_read_at').eq('user_id', userId).is('left_at', null).limit(50);
    const conversationIds = (memberships || []).map((item) => item.conversation_id);
    if (!conversationIds.length) { if (active) callback?.([]); return; }
    const { data: conversations } = await client.from('conversations').select('*').in('id', conversationIds).order('updated_at', { ascending: false });
    const entries = (conversations || []).map((conversation) => ({ ...conversation, conversationId: conversation.id, id: conversation.id, lastMessage: conversation.last_message_preview, lastMessageType: conversation.last_message_type, lastMessageSenderId: conversation.last_message_sender_id, unread: conversation.last_message_sender_id && conversation.last_message_sender_id !== userId && (!memberships.find((item) => item.conversation_id === conversation.id)?.last_read_at || new Date(conversation.last_message_at || 0) > new Date(memberships.find((item) => item.conversation_id === conversation.id)?.last_read_at || 0)) }));
    if (active) callback?.(entries);
  };
  load();
  const channel = client.channel(`private-inbox:${userId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, load).subscribe();
  return () => { active = false; client.removeChannel(channel); };
};

export const markPrivateInboxConversationRead = async (userId, conversationId) => {
  const actor = await assertActor(userId);
  const client = ensureClient();
  const { error } = await client.rpc('mark_private_conversation_read', { target_conversation_id: conversationId });
  if (error) throw error;
  return { success: true };
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const actor = await assertActor(userId);
  const { error } = await ensureClient().from('notifications').update({ read_at: new Date().toISOString() }).eq('id', notificationId).eq('user_id', actor.id);
  if (error) throw error;
  return { success: true };
};
export const markNotificationsAsRead = async (userId, notificationIds = []) => { for (const id of normalizeList(notificationIds)) await markNotificationAsRead(userId, id); return { success: true }; };
export const deleteNotification = async (userId, notificationId) => { const actor = await assertActor(userId); const { error } = await ensureClient().from('notifications').delete().eq('id', notificationId).eq('user_id', actor.id); if (error) throw error; return { success: true }; };
export const deleteNotifications = async (userId, notificationIds = []) => { for (const id of normalizeList(notificationIds)) await deleteNotification(userId, id); return { success: true }; };

export const addToFavorites = async (userId, targetUserId) => { const actor = await assertActor(userId); const { error } = await ensureClient().from('saved_profiles').upsert({ owner_id: actor.id, profile_id: targetUserId }, { onConflict: 'owner_id,profile_id' }); if (error) throw error; return { success: true }; };
export const removeFromFavorites = async (userId, targetUserId) => { const actor = await assertActor(userId); const { error } = await ensureClient().from('saved_profiles').delete().eq('owner_id', actor.id).eq('profile_id', targetUserId); if (error) throw error; return { success: true }; };
export const getFavorites = async (userId) => { const actor = await assertActor(userId); const { data, error } = await ensureClient().from('saved_profiles').select('profile_id, created_at').eq('owner_id', actor.id).order('created_at', { ascending: false }); if (error) throw error; return data || []; };

export const signalPrivateChatOpen = async () => ({ success: true });
export const upsertPrivateMatchState = async () => ({ success: true });
export const subscribeToPrivateMatchState = () => () => {};
export const requestPrivateChatContactShare = async (chatId, requesterId) => {
  await assertActor(requesterId);
  const { data, error } = await ensureClient().rpc('request_private_contact_share', { target_conversation_id: chatId });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return {
    success: Boolean(row?.success),
    alreadyShared: Boolean(row?.already_shared),
    alreadyPending: Boolean(row?.already_pending),
    recipientId: row?.recipient_id || null,
    status: row?.status || null,
  };
};

export const respondToPrivateChatContactShare = async (chatId, responderId, requesterId, accepted) => {
  await assertActor(responderId);
  const { data, error } = await ensureClient().rpc('respond_private_contact_share', {
    target_conversation_id: chatId,
    target_owner_id: requesterId,
    accept_share: Boolean(accepted),
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  return { success: Boolean(row?.success), accepted: Boolean(row?.accepted), expiresAt: row?.expires_at || null };
};

export const revokePrivateChatContactShare = async (chatId, ownerId, recipientId) => {
  await assertActor(ownerId);
  const { data, error } = await ensureClient().rpc('revoke_private_contact_share', {
    target_conversation_id: chatId,
    target_recipient_id: recipientId,
  });
  if (error) throw error;
  return { success: Boolean(data), alreadyRevoked: !data };
};

export const getPrivateChatSharedContacts = async (chatId, ownerIds = []) => {
  const actor = await getCurrentUser();
  const { data, error } = await ensureClient().rpc('get_private_chat_shared_contacts', {
    target_conversation_id: chatId,
    target_owner_ids: Array.isArray(ownerIds) ? ownerIds : [],
  });
  if (error) throw error;
  if (!actor?.id) return {};
  return Object.fromEntries((data || []).map((row) => [row.owner_id, {
    userId: row.user_id || row.owner_id,
    username: row.username || 'Usuario',
    phone: row.phone || '',
  }]));
};

export const getPrivateContactState = async (chatId) => {
  await getCurrentUser();
  const { data, error } = await ensureClient().rpc('get_private_contact_state', { target_conversation_id: chatId });
  if (error) throw error;
  return data || { contactShareRequests: {}, contactShareVisibility: {} };
};
export const sendPrivateChatRequestFromOpin = sendPrivateChatRequest;
export const sendProfileComment = async () => { throw new Error('PROFILE_COMMENTS_PENDING_SUPABASE_SCHEMA'); };
export const respondToPrivateGroupInvite = async () => { throw new Error('GROUP_INVITES_PENDING_SUPABASE_SCHEMA'); };

export default {
  getOrCreatePrivateChat,
  sendMessageToPrivateChat,
  sendRichPrivateChatMessage,
  subscribeToPrivateChatMessages,
  getPrivateChatMessagesBefore,
  getPrivateChatConversation,
  markIncomingMessagesStatus,
  updatePrivateChatTypingStatus,
  subscribeToPrivateChatTyping,
  sendPrivateChatRequest,
  respondToPrivateChatRequest,
  sendDirectMessage,
  subscribeToNotifications,
  subscribeToPrivateInbox,
  markPrivateInboxConversationRead,
  markNotificationAsRead,
  markNotificationsAsRead,
  deleteNotification,
  deleteNotifications,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  requestPrivateChatContactShare,
  respondToPrivateChatContactShare,
  revokePrivateChatContactShare,
  getPrivateChatSharedContacts,
  getPrivateContactState,
};
