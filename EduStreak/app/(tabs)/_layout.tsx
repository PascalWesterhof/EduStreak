import React from 'react';
import 'react-native-gesture-handler';

import { FontAwesome } from '@expo/vector-icons';
// import { Tabs } from 'expo-router'; // No longer using Tabs directly here
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../../components/CustomDrawerContent';

const TabsLayout = () =>
{
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer 
                drawerContent={CustomDrawerContent}
                screenOptions={{
                    headerShown: false, // Ensure headers are hidden
                    drawerActiveTintColor: 'white',
                    drawerInactiveTintColor: '#ccc',
                    drawerActiveBackgroundColor: '#D05B52',
                    drawerLabelStyle: { fontSize: 16 },
                    drawerItemStyle:
                    {
                          borderRadius: 12,
                          marginHorizontal: 8,
                    },
                   }}>
                <Drawer.Screen 
                    name='index'
                    options={{
                        drawerLabel: 'Home',
                        title: 'Home', // Set header title for Home
                        drawerIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen 
                    name='calendar'
                    options={{
                        drawerLabel: 'Calendar',
                        title: 'Calendar',
                        drawerIcon: ({ color, size }) => <FontAwesome name="calendar" size={size} color={color} />,
                    }}
                />
                {/* Add other existing Drawer.Screen items here if they were missed */}
                <Drawer.Screen 
                    name='notifications'
                    options={{
                        drawerLabel: 'Notifications',
                        title: 'Notifications',
                        drawerIcon: ({ color, size }) => <FontAwesome name="bell" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen 
                    name='settings'
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings',
                        drawerIcon: ({ color, size }) => <FontAwesome name="cog" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen 
                    name='leaderboard'
                    options={{
                        drawerLabel: 'Leaderboard',
                        title: 'Leaderboard',
                        drawerIcon: ({ color, size }) => <FontAwesome name="trophy" size={size} color={color} />,
                    }}
                />
                {/* Removed Habits Screen from Drawer */}
                {/* <Drawer.Screen 
                    name='habits' // This should match the filename `habits.tsx`
                    options={{
                        drawerLabel: 'Habits',
                        title: 'My Habits',
                        drawerIcon: ({ color, size }) => <FontAwesome name="check-square-o" size={size} color={color} />,
                    }}
                /> */}
            </Drawer>
            {/* Removed the separate Tabs navigator that was here */}
        </GestureHandlerRootView>
    );
};

export default TabsLayout;
