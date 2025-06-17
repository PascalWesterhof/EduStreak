import 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage'; // ✅ Add this

import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../components/CustomDrawerContent';
import { scheduleDailyReminder, cancelAllScheduledNotifications } from './helpers/notificationReminder';
import { useEffect } from 'react';

const DrawerLayout = () =>
{
        // useEffect runs once when component mounts
      useEffect(() => {
        const setupNotifications = async () => {
            // Request permissions to show notifications
          const { granted } = await Notifications.requestPermissionsAsync();
          if (!granted) return; // Exit if permission not granted

          // Read notification preferences from AsyncStorage
          const notifValue = await AsyncStorage.getItem("notificationsEnabled");
          const dailyValue = await AsyncStorage.getItem("dailyRemindersEnabled");
          // Parse stored string values to booleans, default false if null
          const notificationsEnabled = JSON.parse(notifValue ?? "false");
          const dailyRemindersEnabled = JSON.parse(dailyValue ?? "false");
          // Schedule or cancel daily reminders based on preferences
          if (notificationsEnabled && dailyRemindersEnabled) {
            await scheduleDailyReminder();
          } else {
            await cancelAllScheduledNotifications();
          }
        };
        setupNotifications();
  }, []);
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer drawerContent={CustomDrawerContent}
                screenOptions={{
                    drawerActiveTintColor: 'white',
                    drawerInactiveTintColor: '#ccc',
                    drawerActiveBackgroundColor: '#D05B52',
                    drawerLabelStyle: { fontSize: 16 },
                    drawerItemStyle:
                    {
                          borderRadius: 12,
                          marginHorizontal: 8,
                    },
                    headerShown: false,
                   }}>
                <Drawer.Screen name='index'
                options={{drawerLabel: 'Home', headerTitle: '', headerShown: true}}/>
                <Drawer.Screen name='calendar'
                options={{drawerLabel: 'Calendar', headerTitle: 'Calendar', headerShown: true}}/>
                <Drawer.Screen name='notifications'
                options={{drawerLabel: 'Notifications', headerTitle: 'Notifications', headerShown: true}}/>
                <Drawer.Screen name='leaderboard'
                options={{drawerLabel: 'Leaderboard', headerTitle: '', headerShown: true}}/>
                <Drawer.Screen name='settings'
                options={{drawerLabel: 'Settings', headerTitle: 'Settings', headerShown: true}}/>
                <Drawer.Screen name='gamification'
                options={{drawerItemStyle: { display: 'none'}, headerTitle: ''}}/>
                <Drawer.Screen name='privacy'
                options={{drawerItemStyle: { display: 'none'}, headerTitle: 'Privacy & Data'}}/>
                <Drawer.Screen name='groupboard'
                options={{drawerLabel: 'Group Board', headerTitle:'', headerShown: true}}/>
                <Drawer.Screen name='creategroup'
                options={{drawerItemStyle: { display: 'none'}, headerTitle: '', headerShown: true}}/>
                <Drawer.Screen name='groupdetails'
                options={{drawerItemStyle: { display: 'none'}, headerTitle: '', headerShown: true}}/>
                <Drawer.Screen name='appearance'
                options={{drawerItemStyle: { display: 'none'}, headerTitle: ''}}/>
                <Drawer.Screen name="auth" 
                options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="habit" 
                options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="settingsScreens/profileSettings" 
                options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="settingsScreens/changePasswordScreen" 
                options={{ drawerItemStyle: { display: 'none' } }} />
                <Drawer.Screen name="settingsScreens/deleteAccountScreen" 
                options={{ drawerItemStyle: { display: 'none' } }} />
            </Drawer>
        </GestureHandlerRootView>
    );
};

export default DrawerLayout;
