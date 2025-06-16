import 'react-native-gesture-handler';
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../components/CustomDrawerContent'; // Controleer dit pad
import { scheduleDailyReminder, cancelAllScheduledNotifications } from './helpers/notificationReminder'; // Controleer dit pad
import React, { useEffect } from 'react'; // React is nodig
import { Platform } from 'react-native'; // Platform kan nodig zijn voor web specifieke body style
import * as Notifications from 'expo-notifications'; // Import voor Notifications
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import voor AsyncStorage

// BELANGRIJKE IMPORTS VOOR THEMA
import { ThemeProvider, useTheme } from '../functions/themeFunctions/themeContext'; // Controleer dit pad
import { AppThemeColors } from '../constants/Colors'; // Controleer dit pad



const ConfiguredDrawer = () => {
  // Gebruik useTheme om toegang te krijgen tot themakleuren
  const { colors: themeColors, themeMode } = useTheme();

  // Je bestaande useEffect voor notificaties
  useEffect(() => {
    const setupNotifications = async () => {
      const { granted } = await Notifications.requestPermissionsAsync();
      if (!granted) {
        console.log('Notification permissions not granted');
        return;
      }

      const notifValue = await AsyncStorage.getItem("notificationsEnabled");
      const dailyValue = await AsyncStorage.getItem("dailyRemindersEnabled");

      const notificationsEnabled = JSON.parse(notifValue ?? "false");
      const dailyRemindersEnabled = JSON.parse(dailyValue ?? "false");

      if (notificationsEnabled && dailyRemindersEnabled) {
        await scheduleDailyReminder();
      } else {
        await cancelAllScheduledNotifications();
      }
    };
    setupNotifications();
  }, []);

  useEffect(() => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && document.body) {
        document.body.style.backgroundColor = themeColors.background;
        // document.documentElement.style.backgroundColor = themeColors.background; // Kan ook nuttig zijn
      }
    }, [themeColors.background]);

      return (
        <Drawer
                 drawerContent={props => <CustomDrawerContent {...props} />}
                 screenOptions={{
                   drawerActiveTintColor: themeColors.primaryText,
                   drawerInactiveTintColor: themeColors.textMuted,
                   drawerActiveBackgroundColor: themeColors.primary,
                   drawerLabelStyle: { fontSize: 16 },
                   drawerItemStyle: {
                     borderRadius: 12,
                     marginHorizontal: 8,
                   },
                   drawerStyle: {
                     backgroundColor: themeColors.background,
                   },
                   headerStyle: {
                     backgroundColor: themeColors.headerBackground,
                   },
                   headerTintColor: themeColors.text, // Voor drawer icon & header titel (als geen specifieke title style)
                   headerTitleStyle: {
                     color: themeColors.text,
                   },
                   // Zorg ervoor dat de content van de schermen ook de achtergrondkleur van het thema gebruikt
                   // Dit kan hier of in een geneste Stack navigator, afhankelijk van je setup.
                   // Als de Drawer de buitenste navigator is voor deze schermen, is het hier relevant:
                   sceneContainerStyle: { // Voor Expo Router v3+ (Drawer) / contentStyle voor Stack
                       backgroundColor: themeColors.background,
                   }
                 }}
               >
                 {/* ... al je Drawer.Screen definities ... */}
                 <Drawer.Screen
                   name='index'
                   options={{
                     drawerLabel: 'Home',
                     headerTitle: '',
                     headerShown: true,
                   }}
                 />
                 {/* ... de rest van je schermen ... */}
                  <Drawer.Screen
                   name='calendar'
                   options={{
                     drawerLabel: 'Calendar',
                     headerTitle: 'Calendar',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='notifications'
                   options={{
                     drawerLabel: 'Notifications',
                     headerTitle: 'Notifications',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='leaderboard'
                   options={{
                     drawerLabel: 'Leaderboard',
                     headerTitle: 'Leaderboard',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='settings'
                   options={{
                     drawerLabel: 'Settings',
                     headerTitle: 'Settings',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='gamification'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: 'Gamification',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='privacy'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: 'Privacy & Data',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='groupboard'
                   options={{
                     drawerLabel: 'Group Board', // Was drawerItemStyle: { display: 'none' },
                     headerTitle: 'Group Board',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='creategroup'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: 'Create Group',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='groupdetails'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: 'Group Details',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='appearance'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: 'Appearance',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name="auth"
                   options={{ drawerItemStyle: { display: 'none' }, headerShown: false }}
                 />
                 <Drawer.Screen
                   name="habit"
                   options={{ drawerItemStyle: { display: 'none' }, headerShown: true, headerTitle: 'Habit Details' }}
                 />
                 <Drawer.Screen
                   name="settingsScreens/profileSettings"
                   options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Profile Settings', headerShown: true }}
                 />
                 <Drawer.Screen
                   name="settingsScreens/changePasswordScreen"
                   options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Change Password', headerShown: true }}
                 />
                 <Drawer.Screen
                   name="settingsScreens/deleteAccountScreen"
                   options={{ drawerItemStyle: { display: 'none' }, headerTitle: 'Delete Account', headerShown: true }}
                 />
               </Drawer>
          );
        };

    const RootLayout = () => {
      // De logica om het initiële thema te bepalen (forceer light mode)
      const initialIsDark = false; // Altijd starten met light mode
      const initialTheme = {
        colors: initialIsDark ? AppThemeColors.dark : AppThemeColors.light, // Gebruik AppThemeColors
        isDark: initialIsDark,
        themeMode: initialIsDark ? 'dark' : 'light',
      };

      return (
        <GestureHandlerRootView style={{ flex: 1 }}>
          {/* ThemeProvider moet de ConfiguredDrawer (en dus alles daarbinnen) omvatten */}
          <ThemeProvider initialTheme={initialTheme}>
            <ConfiguredDrawer />
          </ThemeProvider>
        </GestureHandlerRootView>
      );
    };

    export default RootLayout; // Expor