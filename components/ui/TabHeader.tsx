import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabHeaderProps {
  title: string;
  onSearchPress?: () => void;
  onNotificationPress?: () => void;
}

export default function TabHeader({ 
  title,
  onSearchPress,
  onNotificationPress,
}: TabHeaderProps) {
  return (
    <View style={styles.container}>
      {title ? (
        <Text style={styles.title}>{title}</Text>
      ) : (
        <Image source={require('../../assets/anh/logo.png')} style={styles.logoImage} />
      )}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onSearchPress}
        >
          <Ionicons name="search" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.actionButton} 
          onPress={onNotificationPress}
        >
          <Ionicons name="notifications" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  logoImage: {
    width: 160,
    height: 70,
    resizeMode: 'contain',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 16,
  },
}); 