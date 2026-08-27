import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_AVATAR_SRC,
  getSafeAvatarSrc,
  isAllowedAvatarSrc,
} from '../src/utils/avatar.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const chatInput = read('../src/components/chat/ChatInput.jsx');
const firestoreRules = read('../firestore.rules');
const storageRules = read('../storage.rules');
const avatarComponent = read('../src/components/ui/avatar.jsx');
const functions = read('../functions/index.js');
const profileService = read('../src/services/photoUploadService.js');
const opinService = read('../src/services/opinService.js');
const opinPage = read('../src/pages/OpinFeedPage.jsx');
const chatPage = read('../src/pages/ChatPage.jsx');
const chatMessages = read('../src/components/chat/ChatMessages.jsx');
const privateChat = read('../src/components/chat/PrivateChatWindowV2.jsx');
const socialService = read('../src/services/socialService.js');

const publicChatPath = 'chat_media/rooms/uid123/principal/message123/asset123.jpg';

 describe('contratos locales de avatar y fotos', () => {
  it('acepta los orígenes de avatar soportados y rechaza referencias temporales', () => {
    expect(isAllowedAvatarSrc('/avatar_por_defecto.jpeg')).toBe(true);
    expect(isAllowedAvatarSrc('https://res.cloudinary.com/example/image/upload/avatar.jpg')).toBe(true);
    expect(isAllowedAvatarSrc('data:image/svg+xml;base64,abc')).toBe(true);
    expect(isAllowedAvatarSrc('blob:https://example.test/temp')).toBe(false);
    expect(isAllowedAvatarSrc('javascript:alert(1)')).toBe(false);
    expect(isAllowedAvatarSrc('http://example.test/avatar.jpg')).toBe(false);
    expect(getSafeAvatarSrc('blob:expired')).toBe(DEFAULT_AVATAR_SRC);
  });

  it('mantiene la misma estructura de ruta entre ChatInput, Storage y Firestore', () => {
    expect(chatInput).toContain('chat_media/rooms/${user?.id || \'unknown\'}/${roomId || \'principal\'}/${tempMessageId}/${assetId}.${extension}');
    expect(storageRules).toContain('match /chat_media/rooms/{ownerUid}/{roomId}/{messageId}/{assetPath=**}');
    expect(storageRules).toContain('request.auth.uid == ownerUid');
    expect(firestoreRules).toContain("data.media[0].path.matches('^chat_media/rooms/' + request.auth.uid + '/principal/[^/]+/[^/]+$')");
    expect(firestoreRules).not.toContain("data.media[0].path.matches('^chat_media/principal/[^/]+/.+')");
    expect(publicChatPath).toMatch(/^chat_media\/rooms\/uid123\/principal\/[^/]+\/[^/]+\.jpg$/);
  });

  it('exige metadatos de imagen coherentes con la subida del cliente', () => {
    expect(chatInput).toContain("kind: 'image'");
    expect(chatInput).toContain('contentType: optimizedFile.type');
    expect(chatInput).toContain('sizeBytes: optimizedFile.size');
    expect(firestoreRules).toContain("data.media[0].keys().hasAll(['kind', 'path', 'contentType', 'sizeBytes'])");
    expect(firestoreRules).toContain("data.media[0].contentType.matches('image/.*')");
    expect(firestoreRules).toContain('data.media[0].sizeBytes <= 140 * 1024');
  });

  it('mantiene protegido el upload de perfil y no fabrica IDs de invitado', () => {
    expect(profileService).toContain('Debes iniciar sesión para subir una foto de perfil.');
    expect(profileService).not.toContain('guest_${Date.now()}');
    expect(profileService).toContain("publicUrl.startsWith('https://')");
    expect(profileService).toContain("PROFILE_IMAGE_TARGET_MAX_KB = 80");
  });

  it('conecta el fallback de red con el AvatarImage base', () => {
    expect(avatarComponent).toContain('getSafeAvatarSrc(src)');
    expect(avatarComponent).toContain('onError={handleError}');
    expect(avatarComponent).toContain('DEFAULT_AVATAR_SRC');
  });

  it('confirma que el espejo público depende de funciones Firebase desplegables', () => {
    expect(functions).toContain('exports.syncPublicUserProfileMirror = onDocumentWritten(');
    expect(functions).toContain('avatar: normalizePublicString(userData.avatar, 500) || ""');
    expect(functions).toContain('exports.backfillPublicUserProfiles = onCall(');
    expect(firestoreRules).toContain('match /public_user_profiles/{userId}');
    expect(firestoreRules).toContain('allow write: if false;');
  });

  it('expone el orden cronológico de OPIN y no limita la vista pública a 24 tarjetas', () => {
    expect(opinService).toContain('const OPIN_FEED_DEFAULT_LIMIT = 36;');
    expect(opinPage).toContain('const OPIN_FEED_LIMIT = 36;');
    expect(opinPage).toContain("{ id: 'recent', label: 'Más recientes', count: posts.length }");
    expect(opinPage).toContain('Orden actual: publicaciones más recientes primero.');
    expect(opinService).toContain("orderBy('createdAt', 'desc')");
  });

  it('usa el helper global en ChatPage y reporta imágenes compartidas rotas', () => {
    expect(chatPage).toContain("getSafeAvatarSrc, handleAvatarImageError");
    expect(chatPage).toContain('src={getSafeAvatarSrc(item.avatar)}');
    expect(chatMessages).toContain('const handleChatSharedImageError');
    expect(chatMessages).toContain('Imagen no disponible');
    expect(chatMessages).toContain('onError={handleChatSharedImageError}');
  });
});


describe('contratos locales del chat privado activo', () => {
  it('usa identidad pública segura, typing reglado y media privada restringida', () => {
    expect(privateChat).toContain("getSafeAvatarSrc(primaryParticipant.avatar)");
    expect(privateChat).toContain("ALLOWED_PRIVATE_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])");
    expect(privateChat).toContain('accept="image/jpeg,image/png,image/webp"');
    expect(privateChat).toContain('chat_media/private/${user?.id || \'unknown\'}/${chatId}/${tempMessageId}/${assetId}.${extension}');
    expect(socialService).toContain("doc(db, 'private_chats', chatId, 'typing', userId)");
    expect(socialService).toContain("collection(db, 'private_chats', chatId, 'typing')");
    expect(storageRules).toContain('allow read: if isPrivateChatParticipant(chatId);');
    expect(storageRules).toContain("image/(jpeg|png|webp)");
    expect(firestoreRules).toContain('match /typing/{typingUserId}');
  });
});
