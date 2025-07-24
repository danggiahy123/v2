export const API_BASE_URL = 'http://192.168.5.119:3003';

export async function updateNotificationMute(userId: string, isMuted: boolean, muteUntil?: number | null) {
  await fetch(`${API_BASE_URL}/api/users/notification-mute`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isMuted, muteUntil: muteUntil ?? null }),
  });
} 