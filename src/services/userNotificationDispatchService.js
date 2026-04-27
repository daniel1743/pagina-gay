import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

const dispatchUserNotificationCallable = httpsCallable(functions, 'dispatchUserNotification');
const ENABLED_NOTIFICATION_ACTIONS = new Set([
  'direct_message',
  'private_chat_request',
  'private_chat_request_response',
  'private_chat_reopened',
  'private_group_invite_request',
  'private_group_invite_rejected',
  'private_group_chat_ready',
]);

export const dispatchUserNotification = async (action, payload = {}) => {
  if (!action) {
    throw new Error('Notification action is required');
  }

  if (!ENABLED_NOTIFICATION_ACTIONS.has(action)) {
    if (import.meta.env.DEV) {
      console.info('[NOTIFICATIONS] Acción omitida por control de costo:', action);
    }
    return {
      skipped: true,
      action,
      reason: 'disabled_for_cost_control',
    };
  }

  const response = await dispatchUserNotificationCallable({
    action,
    payload,
  });

  return response?.data || {};
};
