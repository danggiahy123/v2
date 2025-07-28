export const API_BASE_URL = 'https://backend-app-lou3.onrender.com';

export async function getNotificationMuteFromServer(userId: string): Promise<{ isMuted: boolean; muteUntil: Date | null } | null> {
  try {
    if (!userId) {
      console.error('❌ userId is required for getNotificationMuteFromServer');
      return null;
    }

    console.log('🔄 Getting notification mute from server for user:', userId);
    
    const response = await fetch(`${API_BASE_URL}/api/users/notification-mute?userId=${userId}`, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json'
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to get notification mute:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    console.log('✅ Notification mute retrieved successfully:', result);
    
    if (result.success && result.data) {
      return result.data;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error getting notification mute from server:', error);
    return null;
  }
}

export async function updateNotificationMute(userId: string, isMuted: boolean, muteUntil?: number | null): Promise<boolean> {
  try {
    if (!userId) {
      console.error('❌ userId is required for updateNotificationMute');
      return false;
    }

    console.log('🔄 Updating notification mute:', { userId, isMuted, muteUntil });
    
    const response = await fetch(`${API_BASE_URL}/api/users/notification-mute`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ userId, isMuted, muteUntil: muteUntil ?? null }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to update notification mute:', response.status, errorText);
      return false;
    }

    const result = await response.json();
    console.log('✅ Notification mute updated successfully:', result);
    return result.success === true;
  } catch (error) {
    console.error('❌ Error updating notification mute:', error);
    return false;
  }
} 