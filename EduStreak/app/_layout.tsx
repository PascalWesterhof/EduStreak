import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import 'react-native-get-random-values';
import 'react-native-reanimated';
import { auth } from '../config/firebase'; // Adjust path if your firebase.js is elsewhere

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (initializing) {
        setInitializing(false);
      }
    });
    return () => unsubscribe();
  }, [initializing]);

  useEffect(() => {
    if (initializing || !loaded) return; // Wait for font loading and auth initialization

    const firstSegment = segments && segments.length > 0 ? segments[0] : '';
    const inAuthGroup = firstSegment === 'auth'; // Check if the first segment is 'auth'

    if (!user && !inAuthGroup) {
      // If not signed in and not in auth group, redirect to login
      router.replace('/auth/LoginScreen' as any);
    } else if (user && inAuthGroup) {
      // If signed in and in auth group (e.g. on LoginScreen), redirect to home
      router.replace('/(tabs)/' as any);
    }
  }, [user, segments, initializing, loaded, router]);

  if (initializing || !loaded) {
    return null; // Or a loading spinner
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        {/* Add auth screens to the stack if they are not in a group */}
        {/* <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} /> */}
        {/* <Stack.Screen name="auth/RegisterScreen" options={{ headerShown: false }} /> */}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
