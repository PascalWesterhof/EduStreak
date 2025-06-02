import { Stack } from 'expo-router';
import React from 'react';

export default function SettingsLayout() {
  return (
    <Stack>
      {/* This screen will use its own custom header */}
      <Stack.Screen name="profileSettings" options={{ headerShown: false }} />
      {/* This screen will also use its own custom header */}
      <Stack.Screen name="changePasswordScreen" options={{ headerShown: false }} />
      <Stack.Screen name="deleteAccountScreen" options={{ headerShown: false }} />
    </Stack>
  );
} 