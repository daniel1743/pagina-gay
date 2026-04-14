import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';

const generateAdminRoomHistoryReportCallable = httpsCallable(functions, 'generateAdminRoomHistoryReport');

export async function generateAdminRoomHistoryReport(roomId = 'principal', days = 7) {
  const safeRoomId = String(roomId || 'principal').trim() || 'principal';
  const safeDays = 7;

  const result = await generateAdminRoomHistoryReportCallable({
    roomId: safeRoomId,
    days: safeDays,
  });

  return result.data;
}
