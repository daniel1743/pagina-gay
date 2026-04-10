import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

const dispatchUserNotificationCallable = httpsCallable(functions, 'dispatchUserNotification');

export const dispatchUserNotification = async (action, payload = {}) => {
  if (!action) {
    throw new Error('Notification action is required');
  }

  const response = await dispatchUserNotificationCallable({
    action,
    payload,
  });

  return response?.data || {};
};
