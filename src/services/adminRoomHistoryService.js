import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

const generateAdminRoomHistoryReportCallable = httpsCallable(functions, 'generateAdminRoomHistoryReport');
const ADMIN_ROOM_HISTORY_CACHE_TTL_MS = 5 * 60 * 1000;
const adminRoomHistoryCache = new Map();

export async function generateAdminRoomHistoryReport(roomId = 'principal', days = 7) {
  const safeRoomId = String(roomId || 'principal').trim() || 'principal';
  const safeDays = 7;
  const cacheKey = `${safeRoomId}:${safeDays}`;
  const now = Date.now();
  const cached = adminRoomHistoryCache.get(cacheKey);

  if (cached && (now - cached.savedAt) < ADMIN_ROOM_HISTORY_CACHE_TTL_MS) {
    return cached.data;
  }

  const result = await generateAdminRoomHistoryReportCallable({
    roomId: safeRoomId,
    days: safeDays,
  });

  adminRoomHistoryCache.set(cacheKey, {
    savedAt: now,
    data: result.data,
  });

  return result.data;
}
