import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationMuteOption = 'on' | 'off' | '1h' | '8h' | '1d';

export interface NotificationSettings {
  muteOption: NotificationMuteOption;
  muteUntil?: number; // timestamp (milliseconds)
}

const NOTIFICATION_SETTINGS_KEY = 'notification_settings';

export async function setNotificationMute(option: NotificationMuteOption) {
  let muteUntil: number | undefined;
  const now = Date.now();
  if (option === '1h') muteUntil = now + 3600 * 1000;
  else if (option === '8h') muteUntil = now + 8 * 3600 * 1000;
  else if (option === '1d') muteUntil = now + 24 * 3600 * 1000;
  else if (option === 'off') muteUntil = Number.MAX_SAFE_INTEGER;
  else muteUntil = undefined;

  await AsyncStorage.setItem(
    NOTIFICATION_SETTINGS_KEY,
    JSON.stringify({ muteOption: option, muteUntil })
  );
}

export async function getNotificationMute(): Promise<NotificationSettings> {
  const data = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
  if (!data) return { muteOption: 'on' };
  const settings = JSON.parse(data);
  if (
    settings.muteUntil &&
    Date.now() > settings.muteUntil &&
    settings.muteOption !== 'off'
  ) {
    // Hết hạn, tự động bật lại
    await setNotificationMute('on');
    return { muteOption: 'on' };
  }
  return settings;
}

export async function isNotificationMuted(): Promise<boolean> {
  const settings = await getNotificationMute();
  if (settings.muteOption === 'on') return false;
  if (settings.muteOption === 'off') return true;
  if (settings.muteUntil && Date.now() < settings.muteUntil) return true;
  return false;
} 