import { useRouter } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.topBar}>
      {showBackButton && (
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
      )}
      <Text style={styles.topBarTitle}>{title}</Text>
      {rightComponent && (
        <View style={styles.rightComponent}>
          {rightComponent}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000',
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  topBarTitle: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: '600',
    flex: 1,
  },
  rightComponent: {
    marginLeft: 'auto',
  },
}); 