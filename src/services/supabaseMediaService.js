import imageCompression from 'browser-image-compression';
import { supabase } from '@/config/supabase';

export const SUPABASE_MEDIA_BUCKETS = {
  avatars: 'avatars',
  card: 'card-media',
  chatPublic: 'chat-public',
  chatPrivate: 'chat-private',
};

export const SUPABASE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const SUPABASE_IMAGE_MAX_INPUT_BYTES = 10 * 1024 * 1024;
export const SUPABASE_IMAGE_MAX_BYTES = 140 * 1024;

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

export const validateSupabaseImage = (file, maxInputBytes = SUPABASE_IMAGE_MAX_INPUT_BYTES) => {
  if (!file) return { valid: false, error: 'No se seleccionó ningún archivo.' };
  if (!SUPABASE_IMAGE_TYPES.has(file.type)) return { valid: false, error: 'Solo se permiten imágenes JPG, PNG o WEBP.' };
  if (!Number.isFinite(file.size) || file.size < 1 || file.size > maxInputBytes) return { valid: false, error: 'La imagen supera el tamaño máximo permitido.' };
  return { valid: true };
};

export const compressSupabaseImage = async (file, maxBytes = SUPABASE_IMAGE_MAX_BYTES, maxDimension = 960) => {
  const validation = validateSupabaseImage(file);
  if (!validation.valid) throw new Error(validation.error);
  const compressed = await imageCompression(file, {
    maxSizeMB: maxBytes / (1024 * 1024),
    maxWidthOrHeight: maxDimension,
    useWebWorker: true,
    initialQuality: 0.68,
    maxIteration: 15,
    fileType: 'image/webp',
  });
  if (compressed.size > maxBytes) throw new Error('La imagen no pudo comprimirse dentro del límite permitido.');
  return compressed;
};

const extensionFor = (mime = '') => mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
const safeSegment = (value, fallback = 'asset') => String(value || fallback).replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);

export const uploadSupabaseMedia = async ({ file, bucket, pathPrefix, maxBytes = SUPABASE_IMAGE_MAX_BYTES, maxDimension = 960, upsert = false, pathPrefixIncludesUser = false }) => {
  const user = await currentUser();
  const client = ensureClient();
  const compressed = await compressSupabaseImage(file, maxBytes, maxDimension);
  const extension = extensionFor(compressed.type);
  const normalizedPrefix = safeSegment(pathPrefix, 'asset');
  const path = `${pathPrefixIncludesUser ? normalizedPrefix : `${user.id}/${normalizedPrefix}`}/${Date.now()}_${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from(bucket).upload(path, compressed, { contentType: compressed.type, cacheControl: '3600', upsert });
  if (error) throw error;
  const publicBucket = bucket === SUPABASE_MEDIA_BUCKETS.avatars;
  const result = { bucket, path, mimeType: compressed.type, size: compressed.size };
  if (publicBucket) {
    const { data } = client.storage.from(bucket).getPublicUrl(path);
    result.url = data?.publicUrl || null;
  } else {
    const { data, error: signedError } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60);
    if (signedError) throw signedError;
    result.url = data?.signedUrl || null;
  }
  if (!result.url?.startsWith('https://')) throw new Error('SUPABASE_MEDIA_URL_INVALID');
  return result;
};

export const uploadProfilePhotoToSupabase = async (file, requestedUserId = null) => {
  const user = await currentUser();
  if (requestedUserId && requestedUserId !== user.id) throw new Error('NOT_PROFILE_OWNER');
  return uploadSupabaseMedia({ file, bucket: SUPABASE_MEDIA_BUCKETS.avatars, pathPrefix: 'principal', maxBytes: 80 * 1024, maxDimension: 400 });
};

export const uploadPrivateChatPhotoToSupabase = async (file, chatId, messageId = crypto.randomUUID()) => uploadSupabaseMedia({
  file,
  bucket: SUPABASE_MEDIA_BUCKETS.chatPrivate,
  pathPrefix: `${safeSegment(chatId, 'chat')}/${safeSegment((await currentUser()).id, 'user')}/${safeSegment(messageId, 'message')}`,
  pathPrefixIncludesUser: true,
  maxBytes: SUPABASE_IMAGE_MAX_BYTES,
  maxDimension: 960,
});

export const uploadPublicChatPhotoToSupabase = async (file, roomId, messageId = crypto.randomUUID()) => uploadSupabaseMedia({
  file,
  bucket: SUPABASE_MEDIA_BUCKETS.chatPublic,
  pathPrefix: `${safeSegment(roomId, 'room')}/${safeSegment(messageId, 'message')}`,
  maxBytes: SUPABASE_IMAGE_MAX_BYTES,
  maxDimension: 960,
});

export const refreshSignedMediaUrl = async (bucket, path, expiresIn = 60 * 60) => {
  const client = ensureClient();
  const { data, error } = await client.storage.from(bucket).createSignedUrl(path, expiresIn);
  if (error) throw error;
  const url = data?.signedUrl || null;
  if (!url?.startsWith('https://')) throw new Error('SUPABASE_MEDIA_URL_INVALID');
  return url;
};

export const deleteSupabaseMedia = async (bucket, paths = []) => {
  const user = await currentUser();
  const safePaths = (Array.isArray(paths) ? paths : [paths]).filter((path) => String(path || '').startsWith(`${user.id}/`)).slice(0, 10);
  if (!safePaths.length) return { success: true, removed: 0 };
  const { error } = await ensureClient().storage.from(bucket).remove(safePaths);
  if (error) throw error;
  return { success: true, removed: safePaths.length };
};
