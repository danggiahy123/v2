import React, { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';

import { ThemedView } from '@/components/common';
import { IconSymbol } from '@/components/navigation';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CollapsibleProps {
  children: React.ReactNode;
  title?: string;
  iconColor?: string;
  maxLines?: number;
  textStyle?: any;
  expandText?: string;
  collapseText?: string;
}

export function Collapsible({ 
  children, 
  title,
  iconColor,
  maxLines = 3,
  textStyle,
  expandText = '(... xem thêm)',
  collapseText = '(thu gọn)'
}: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldShowButton, setShouldShowButton] = useState(false);
  const theme = useColorScheme() ?? 'light';

  // Legacy mode: with title and icon
  if (title) {
    return (
      <ThemedView style={{ backgroundColor: 'transparent' }}>
        <TouchableOpacity
          style={styles.heading}
          onPress={() => setIsOpen((value) => !value)}
          activeOpacity={0.8}>
          <IconSymbol
            name="chevron.down"
            size={24}
            weight="medium"
            color={iconColor || (theme === 'light' ? Colors.light.icon : Colors.dark.icon)}
            style={{}}
          />
        </TouchableOpacity>
        {isOpen && <ThemedView style={[styles.content, { backgroundColor: 'transparent' }]}>{children}</ThemedView>}
      </ThemedView>
    );
  }

  // Text mode with line counting
  const handleTextLayout = (event: any) => {
    const { lines } = event.nativeEvent;
    console.log('Số dòng mô tả:', lines.length, 'maxLines:', maxLines);
    if (lines && lines.length >= maxLines) {
      setShouldShowButton(true);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <ThemedView style={{ backgroundColor: 'transparent' }}>
      <Text
        style={[styles.text, textStyle]}
        numberOfLines={isExpanded ? undefined : maxLines}
        onTextLayout={handleTextLayout}
      >
        {children}
      </Text>
      
      {shouldShowButton && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpanded}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.expandText,
            { color: theme === 'light' ? Colors.light.text : Colors.dark.text }
          ]}>
            {isExpanded ? collapseText : expandText}
          </Text>
        </TouchableOpacity>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  // Legacy styles
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  content: {
    marginTop: 6,
  },
  
  // Text styles
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ccc',
  },
  expandButton: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  expandText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ff6b6b',
  },
});
