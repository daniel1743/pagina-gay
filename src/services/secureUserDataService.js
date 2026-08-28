import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { isSupabaseAuthEnabled } from '@/config/supabase';
import { getPrivateChatSharedContacts as getSupabasePrivateChatSharedContacts } from '@/services/supabasePrivateChatService';

const getPrivateChatSharedContactsCallable = httpsCallable(functions, 'getPrivateChatSharedContacts');
const getFavoriteAudienceCountCallable = httpsCallable(functions, 'getFavoriteAudienceCount');

export const getPrivateChatSharedContacts = async (chatId, ownerIds = []) => {
  if (isSupabaseAuthEnabled()) return getSupabasePrivateChatSharedContacts(chatId, ownerIds);
  if (!chatId) {
    throw new Error('chatId es requerido');
  }

  const response = await getPrivateChatSharedContactsCallable({
    chatId,
    ownerIds: Array.isArray(ownerIds) ? ownerIds : [],
  });

  return response?.data?.contacts || {};
};

export const getFavoriteAudienceCount = async (userId = null) => {
  if (isSupabaseAuthEnabled()) return 0;
  const response = await getFavoriteAudienceCountCallable({
    ...(userId ? { userId } : {}),
  });

  return Number(response?.data?.count || 0);
};
