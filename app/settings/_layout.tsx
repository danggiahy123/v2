import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="account" />
      <Stack.Screen name="help" />
      <Stack.Screen name="about" />
      <Stack.Screen name="terms" />
      <Stack.Screen name="contact" />
      <Stack.Screen name="privacy" />
    </Stack>
  );
}
