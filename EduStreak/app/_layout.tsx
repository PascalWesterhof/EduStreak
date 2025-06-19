import AsyncStorage from '@react-native-async-storage/async-storage'; // Import for AsyncStorage
import * as Notifications from 'expo-notifications'; // Import for Notifications
import { Drawer } from "expo-router/drawer";
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-get-random-values';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { cancelAllScheduledNotifications, scheduleDailyReminder } from '../helpers/notificationReminder';

import { AppThemeColors } from '../constants/Colors';
import { ThemeProvider, useTheme } from '../functions/themeFunctions/themeContext';



const ConfiguredDrawer = () => {
  const { colors: themeColors, themeMode } = useTheme();

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
                   headerTintColor: themeColors.text, // For drawer icon & header title
                   headerTitleStyle: {
                     color: themeColors.text,
                   },
                   sceneContainerStyle: {
                       backgroundColor: themeColors.background,
                   }
                 }}
               >
                 <Drawer.Screen
                   name='index'
                   options={{
                     drawerLabel: 'Home',
                     headerTitle: '',
                     headerShown: true,
                   }}
                 />
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
                   name='groupboard'
                   options={{
                     drawerLabel: 'Group Board',
                     headerTitle: '',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='leaderboard'
                   options={{
                     drawerLabel: 'Leaderboard',
                     headerTitle: '',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='settings'
                   options={{
                     drawerLabel: 'Settings',
                     headerTitle: '',
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
                   name='creategroup'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: '',
                     headerShown: true,
                   }}
                 />
                 <Drawer.Screen
                   name='groupdetails'
                   options={{
                     drawerItemStyle: { display: 'none' },
                     headerTitle: '',
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
                   options={{
                    drawerItemStyle: { display: 'none' }, 
                    headerShown: false 
                  }}
                 />
                 <Drawer.Screen
                   name="habit"
                   options={{ 
                    drawerItemStyle: { display: 'none' }, 
                    headerShown: false, 
                  }}
                 />
                 <Drawer.Screen
                   name="settingsScreens/profileSettings"
                   options={{ 
                    drawerItemStyle: { display: 'none' }, 
                    headerShown: false }}
                 />
                 <Drawer.Screen
                   name="settingsScreens/changePasswordScreen"
                   options={{ 
                    drawerItemStyle: { display: 'none' }, 
                    headerShown: false 
                  }}
                 />
                 <Drawer.Screen
                   name="settingsScreens/deleteAccountScreen"
                   options={{ 
                    drawerItemStyle: { display: 'none' }, 
                    headerShown: false 
                  }}
                 />
               </Drawer>
          );
        };

    const RootLayout = () => {
      // Forces the app to start on Light mode
      const initialIsDark = false;
      const initialTheme = {
        colors: initialIsDark ? AppThemeColors.dark : AppThemeColors.light,
        isDark: initialIsDark,
        themeMode: initialIsDark ? 'dark' : 'light',
      };

      return (
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider initialTheme={initialTheme}>
            <ConfiguredDrawer />
          </ThemeProvider>
        </GestureHandlerRootView>
      );
    };

    export default RootLayout;