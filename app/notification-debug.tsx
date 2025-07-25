import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { notificationService } from '../services/notificationService';
import { usePushNotifications } from '../hooks/usePushNotifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function NotificationDebugScreen() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  const pushNotifications = usePushNotifications(userId || undefined);

  useEffect(() => {
    const getUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userId');
        if (storedUserId) {
          setUserId(storedUserId);
          addLog(`User ID loaded: ${storedUserId}`);
        } else {
          addLog('No user ID found in storage');
        }
      } catch (error) {
        addLog(`Error getting userId: ${error}`);
      }
    };

    getUserId();
  }, []);

  useEffect(() => {
    const token = notificationService.getPushToken();
    if (token) {
      setPushToken(token);
      addLog(`Push token available: ${token.substring(0, 20)}...`);
    } else {
      addLog('No push token available');
    }
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
  };

  const handleRegisterPushToken = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    // Test userId format
    addLog(`Testing userId format: ${userId}`);
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(userId);
    addLog(`UserId is valid ObjectId: ${isValidObjectId}`);
    
    if (!isValidObjectId) {
      addLog('❌ UserId is not a valid MongoDB ObjectId');
      Alert.alert('Error', 'UserId is not a valid MongoDB ObjectId format');
      return;
    }

    try {
      addLog('Registering push token...');
      await notificationService.initialize(userId);
      
      const token = notificationService.getPushToken();
      if (token) {
        setPushToken(token);
        addLog(`Push token registered: ${token.substring(0, 20)}...`);
        Alert.alert('Success', 'Push token registered successfully');
      } else {
        addLog('Failed to get push token');
        Alert.alert('Error', 'Failed to register push token');
      }
    } catch (error) {
      addLog(`Error registering push token: ${error}`);
      Alert.alert('Error', `Failed to register push token: ${error}`);
    }
  };

  const handleTestNotification = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      addLog('Testing notification API...');
      const response = await notificationService.getNotifications(userId);
      addLog(`API Response: ${response.data.notifications.length} notifications`);
      Alert.alert('Success', `Found ${response.data.notifications.length} notifications`);
    } catch (error) {
      addLog(`Error testing API: ${error}`);
      Alert.alert('Error', `API test failed: ${error}`);
    }
  };

  const handleSendTestNotification = async () => {
    if (!userId) {
      Alert.alert('Error', 'User ID not found');
      return;
    }

    try {
      addLog('Sending test notification...');
      const response = await fetch('http://192.168.9.83:3003/api/admin/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': userId,
        },
                  body: JSON.stringify({
            userId: userId,
            title: 'Test từ Mobile App',
            body: 'Đây là test notification từ mobile app debug',
            target_type: 'all',
            type: 'manual',
            event_type: 'test',
            priority: 'high',
            created_by: userId,
          }),
      });

      const result = await response.json();
      if (result.success) {
        addLog(`Test notification created: ${result.data._id}`);
        
        // Send the notification
        const sendResponse = await fetch(`http://192.168.9.83:3003/api/admin/notifications/${result.data._id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'user-id': userId,
          },
          body: JSON.stringify({ userId }),
        });

        const sendResult = await sendResponse.json();
        if (sendResult.success) {
          addLog('Test notification sent successfully');
          Alert.alert('Success', 'Test notification sent!');
        } else {
          addLog(`Failed to send: ${sendResult.message}`);
          Alert.alert('Error', `Failed to send: ${sendResult.message}`);
        }
      } else {
        addLog(`Failed to create: ${result.message}`);
        Alert.alert('Error', `Failed to create: ${result.message}`);
      }
    } catch (error) {
      addLog(`Error sending test notification: ${error}`);
      Alert.alert('Error', `Failed to send test notification: ${error}`);
    }
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Debug</Text>
        <TouchableOpacity style={styles.clearButton} onPress={handleClearLogs}>
          <Ionicons name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>User ID:</Text>
              <Text style={styles.statusValue}>{userId || 'Not found'}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Push Token:</Text>
              <Text style={styles.statusValue}>
                {pushToken ? `${pushToken.substring(0, 20)}...` : 'Not available'}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionsCard}>
            <TouchableOpacity style={styles.actionButton} onPress={handleRegisterPushToken}>
              <Ionicons name="notifications" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Register Push Token</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleTestNotification}>
              <Ionicons name="cloud-download" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Test API Connection</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSendTestNotification}>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Send Test Notification</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Logs Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Debug Logs</Text>
          <View style={styles.logsCard}>
            {logs.length === 0 ? (
              <Text style={styles.noLogsText}>No logs yet</Text>
            ) : (
              logs.map((log, index) => (
                <Text key={index} style={styles.logText}>
                  {log}
                </Text>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    color: '#ccc',
    fontSize: 16,
  },
  statusValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  actionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E50914',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  logsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 16,
    maxHeight: 300,
  },
  noLogsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  logText: {
    color: '#ccc',
    fontSize: 12,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});
