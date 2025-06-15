import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
}

export default function Header({ 
  title, 
  showBackButton = true, 
  onBackPress,
  rightComponent
}: HeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>
        )}
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
      </View>
      {rightComponent && (
        <View style={styles.rightSection}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingBottom: 10,
    paddingHorizontal: 16,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  rightSection: {
    marginLeft: 16,
  },
}); 