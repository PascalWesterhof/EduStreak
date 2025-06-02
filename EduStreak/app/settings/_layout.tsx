import { Stack } from 'expo-router';
import React from 'react';

/**
 * `SettingsLayout` defines the stack navigator for the settings section of the application.
 * It includes screens for profile settings, changing password, and deleting an account.
 * Each screen within this layout is configured to hide the default stack header,
 * as they implement their own custom headers.
 */
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