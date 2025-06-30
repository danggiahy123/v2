import React, { PropsWithChildren, useState } from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedView } from '@/components/common';
import { IconSymbol } from '@/components/navigation';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function Collapsible({ children, iconColor }: PropsWithChildren & { iconColor?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const theme = useColorScheme() ?? 'light';

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

const styles = StyleSheet.create({
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  content: {
    marginTop: 6,
  },
});
