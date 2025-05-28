import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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

  const mainContent = (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        {/* Add auth screens to the stack if they are not in a group */}
        <Stack.Screen name="auth/LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/RegisterScreen" options={{ headerShown: false }} />
        <Stack.Screen name="auth/ForgotPasswordScreen" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuterContainer}>
        <View style={styles.webInnerContainer}>
          {mainContent}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.nativeContainer}>
      {mainContent}
    </View>
  );
}

const styles = StyleSheet.create({
  nativeContainer: {
    flex: 1,
  },
  webOuterContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center', 
    // justifyContent: 'center', // Removed to allow inner to stick to top if not full height by default
  },
  webInnerContainer: {
    width: '100%',
    maxWidth: 1200, // Increased width
    height: '100%', // Full height
    // maxHeight: Dimensions.get('window').height * 0.9, // This is no longer needed if height is 100%
    backgroundColor: 'white', 
    borderRadius: Platform.OS === 'web' ? 8 : 0, // Subtle rounded corners for the "app window"
    overflow: 'hidden', // Important to contain the drawer and rounded corners
    elevation: Platform.OS === 'web' ? 5 : 0, // Shadow for web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});
