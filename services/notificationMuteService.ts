export const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

export async function updateNotificationMute(userId: string, isMuted: boolean, muteUntil?: number | null) {
  await fetch(`${API_BASE_URL}/api/users/notification-mute`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, isMuted, muteUntil: muteUntil ?? null }),
  });
} 