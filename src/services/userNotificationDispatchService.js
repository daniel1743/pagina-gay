import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import { isSupabaseAuthEnabled } from '@/config/supabase';

const dispatchUserNotificationCallable = httpsCallable(functions, 'dispatchUserNotification');
const ENABLED_NOTIFICATION_ACTIONS = new Set([
  'private_chat_request',
  'private_chat_request_response',
  'private_group_invite_request',
  'private_group_invite_rejected',
  'private_group_chat_ready',
]);

export const dispatchUserNotification = async (action, payload = {}) => {
  if (isSupabaseAuthEnabled()) {
    return { skipped: true, action, reason: 'supabase_notifications_are_server_side' };
  }
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
