import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { supabase, isSupabaseAuthEnabled } from '@/config/supabase';
import { track } from '@/services/eventTrackingService';

const CONTACT_SAFETY_EVENT_COLLECTION = 'contactSafetyEvents';

const getBlockedRiskDelta = (surface = 'unknown', blockedType = 'external_contact') => {
  if (surface === 'opin_public') {
    return blockedType === 'phone_number' ? 4 : 3;
  }
  if (surface === 'private_chat') {
    return blockedType === 'phone_number' ? 3 : 2;
  }
  return 1;
};

const buildUserRiskPatch = ({
  eventType,
  surface,
  blockedType,
  riskDelta = 0,
}) => {
  const isBlockedAttempt = eventType === 'blocked_attempt';
  const isOpinBlocked = isBlockedAttempt && surface === 'opin_public';
  const isPrivateBlocked = isBlockedAttempt && surface === 'private_chat';

  return {
    contactSafety: {
      totalEvents: increment(1),
      blockedAttempts: increment(isBlockedAttempt ? 1 : 0),
      blockedAttemptsOpin: increment(isOpinBlocked ? 1 : 0),
      blockedAttemptsPrivate: increment(isPrivateBlocked ? 1 : 0),
      shareRequests: increment(eventType === 'share_requested' ? 1 : 0),
      shareAccepted: increment(eventType === 'share_accepted' ? 1 : 0),
      shareRejected: increment(eventType === 'share_rejected' ? 1 : 0),
      shareRevoked: increment(eventType === 'share_revoked' ? 1 : 0),
      riskScore: increment(riskDelta),
      lastEventType: eventType,
      lastSurface: surface || null,
      lastBlockedType: blockedType || null,
      lastEventAt: serverTimestamp(),
    },
  };
};

export const recordContactSafetyEvent = async ({
  userId,
  eventType,
  surface = 'unknown',
  blockedType = null,
  riskDelta = 0,
  chatId = null,
  metadata = {},
}) => {
  if (!userId || !eventType) return;

  const normalizedRiskDelta = Number.isFinite(Number(riskDelta)) ? Number(riskDelta) : 0;

  if (isSupabaseAuthEnabled()) {
    const { data, error } = await supabase.rpc('record_contact_safety_event', {
      target_user_id: userId,
      target_event_type: eventType,
      target_surface: surface,
      target_blocked_type: blockedType,
      target_risk_delta: normalizedRiskDelta,
      target_chat_id: chatId || null,
      target_metadata: metadata && typeof metadata === 'object' ? metadata : {},
    });
    if (error) console.warn('[CONTACT_SAFETY] No se pudo guardar telemetría Supabase:', error.message);
    await track('contact_safety_event', { event_type: eventType, surface, blocked_type: blockedType, risk_delta: normalizedRiskDelta, chat_id: chatId || null }, { user: { id: userId } });
    return data;
  }

  const payload = {
    userId,
    eventType,
    surface,
    blockedType,
    riskDelta: normalizedRiskDelta,
    chatId: chatId || null,
    metadata: metadata && typeof metadata === 'object' ? metadata : {},
    createdAt: serverTimestamp(),
  };

  await Promise.allSettled([
    addDoc(collection(db, CONTACT_SAFETY_EVENT_COLLECTION), payload),
    setDoc(
      doc(db, 'users', userId),
      buildUserRiskPatch({
        eventType,
        surface,
        blockedType,
        riskDelta: normalizedRiskDelta,
      }),
      { merge: true }
    ),
    track('contact_safety_event', {
      event_type: eventType,
      surface,
      blocked_type: blockedType,
      risk_delta: normalizedRiskDelta,
      chat_id: chatId || null,
    }, { user: { id: userId } }),
  ]);
};

export const recordBlockedContactAttempt = async ({
  userId,
  surface,
  blockedType,
  chatId = null,
  metadata = {},
}) => {
  if (!userId) return;

  return recordContactSafetyEvent({
    userId,
    eventType: 'blocked_attempt',
    surface,
    blockedType,
    riskDelta: getBlockedRiskDelta(surface, blockedType),
    chatId,
    metadata,
  });
};

