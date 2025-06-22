import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface DebugHighlightProps {
  children: React.ReactNode;
  label: string;
  color?: string;
  enabled?: boolean;
  style?: ViewStyle;
}

const DebugHighlight: React.FC<DebugHighlightProps> = ({ 
  children, 
  label, 
  color = '#ff0000', 
  enabled = true,
  style 
}) => {
  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <View style={[
      styles.container,
      { borderColor: color },
      style
    ]}>
      <Text style={[styles.label, { color, backgroundColor: color + '20' }]}>
        {label}
      </Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderStyle: 'dashed',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    top: -12,
    left: 5,
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 1000,
  },
});

export default DebugHighlight; 