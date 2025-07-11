import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Switch, 
  StyleSheet, 
  Alert, 
  ScrollView,
  TouchableOpacity 
} from 'react-native';
import { NotificationService } from '../../services/notificationService';

interface NotificationSettingsProps {
  userId?: string;
}

interface Settings {
  pushNotificationsEnabled: boolean;
  notificationSettings: {
    newMovies: boolean;
    newEpisodes: boolean;
    favoriteGenres: string[];
    quietHours: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
}

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller'];

export function NotificationSettings({ userId }: NotificationSettingsProps) {
  const [settings, setSettings] = useState<Settings>({
    pushNotificationsEnabled: true,
    notificationSettings: {
      newMovies: true,
      newEpisodes: true,
      favoriteGenres: [],
      quietHours: {
        start: '22:00',
        end: '08:00',
        enabled: false
      }
    }
  });
  const [loading, setLoading] = useState(false);

  const notificationService = NotificationService.getInstance();

  const updateSettings = async (newSettings: Partial<Settings>) => {
    if (!userId) {
      Alert.alert('Error', 'Please login to change notification settings');
      return;
    }

    setLoading(true);
    try {
      const success = await notificationService.updateNotificationSettings(newSettings);
      
      if (success) {
        setSettings(prev => ({ ...prev, ...newSettings }));
        Alert.alert('Success', 'Notification settings updated');
      } else {
        Alert.alert('Error', 'Failed to update notification settings');
      }
    } catch (error) {
      console.error('Error updating notification settings:', error);
      Alert.alert('Error', 'An error occurred while updating settings');
    } finally {
      setLoading(false);
    }
  };

  const toggleNotifications = (enabled: boolean) => {
    updateSettings({ pushNotificationsEnabled: enabled });
  };

  const toggleNewMovies = (enabled: boolean) => {
    updateSettings({
      notificationSettings: {
        ...settings.notificationSettings,
        newMovies: enabled
      }
    });
  };

  const toggleNewEpisodes = (enabled: boolean) => {
    updateSettings({
      notificationSettings: {
        ...settings.notificationSettings,
        newEpisodes: enabled
      }
    });
  };

  const toggleGenre = (genre: string) => {
    const currentGenres = settings.notificationSettings.favoriteGenres;
    const newGenres = currentGenres.includes(genre)
      ? currentGenres.filter(g => g !== genre)
      : [...currentGenres, genre];

    updateSettings({
      notificationSettings: {
        ...settings.notificationSettings,
        favoriteGenres: newGenres
      }
    });
  };

  const toggleQuietHours = (enabled: boolean) => {
    updateSettings({
      notificationSettings: {
        ...settings.notificationSettings,
        quietHours: {
          ...settings.notificationSettings.quietHours,
          enabled
        }
      }
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>
      
      {/* Main Toggle */}
      <View style={styles.settingRow}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Push Notifications</Text>
          <Text style={styles.settingDescription}>
            Enable or disable all push notifications
          </Text>
        </View>
        <Switch
          value={settings.pushNotificationsEnabled}
          onValueChange={toggleNotifications}
          disabled={loading}
        />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {settings.pushNotificationsEnabled && (
        <>
          {/* New Movies */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>New Movies</Text>
              <Text style={styles.settingDescription}>
                Get notified when new movies are added
              </Text>
            </View>
            <Switch
              value={settings.notificationSettings.newMovies}
              onValueChange={toggleNewMovies}
              disabled={loading}
            />
          </View>

          {/* New Episodes */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>New Episodes</Text>
              <Text style={styles.settingDescription}>
                Get notified when new episodes of your series are available
              </Text>
            </View>
            <Switch
              value={settings.notificationSettings.newEpisodes}
              onValueChange={toggleNewEpisodes}
              disabled={loading}
            />
          </View>

          {/* Favorite Genres */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Favorite Genres</Text>
            <Text style={styles.sectionDescription}>
              Select genres you're interested in for personalized notifications
            </Text>
            <View style={styles.genreContainer}>
              {GENRES.map(genre => (
                <TouchableOpacity
                  key={genre}
                  style={[
                    styles.genreChip,
                    settings.notificationSettings.favoriteGenres.includes(genre) &&
                      styles.genreChipSelected
                  ]}
                  onPress={() => toggleGenre(genre)}
                  disabled={loading}
                >
                  <Text
                    style={[
                      styles.genreText,
                      settings.notificationSettings.favoriteGenres.includes(genre) &&
                        styles.genreTextSelected
                    ]}
                  >
                    {genre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Quiet Hours */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Quiet Hours</Text>
              <Text style={styles.settingDescription}>
                No notifications from 22:00 to 08:00
              </Text>
            </View>
            <Switch
              value={settings.notificationSettings.quietHours.enabled}
              onValueChange={toggleQuietHours}
              disabled={loading}
            />
          </View>

          {/* Push Token Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Device Info</Text>
            <Text style={styles.infoText}>
              Push Token: {notificationService.getPushToken()?.substring(0, 20)}...
            </Text>
            <Text style={styles.infoText}>
              User ID: {notificationService.getUserId()}
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  section: {
    marginVertical: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
  },
  genreContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genreChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#333',
    borderWidth: 1,
    borderColor: '#555',
  },
  genreChipSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  genreText: {
    color: '#fff',
    fontSize: 14,
  },
  genreTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
}); 