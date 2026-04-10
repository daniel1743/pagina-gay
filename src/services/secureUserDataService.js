import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

const getPrivateChatSharedContactsCallable = httpsCallable(functions, 'getPrivateChatSharedContacts');
const getFavoriteAudienceCountCallable = httpsCallable(functions, 'getFavoriteAudienceCount');

export const getPrivateChatSharedContacts = async (chatId, ownerIds = []) => {
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
  const response = await getFavoriteAudienceCountCallable({
    ...(userId ? { userId } : {}),
  });

  return Number(response?.data?.count || 0);
};
