import React from 'react';
import 'react-native-gesture-handler';

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
                    headerShown: true, // Ensure headers are shown
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
                        title: 'Home' // Set header title for Home
                    }}
                />
                <Drawer.Screen 
                    name='calendar'
                    options={{
                        drawerLabel: 'Calendar',
                        title: 'Calendar' // Set header title for Calendar
                    }}
                />
                <Drawer.Screen 
                    name='notifications'
                    options={{
                        drawerLabel: 'Notifications',
                        title: 'Notifications' // Set header title for Notifications
                    }}
                />
                <Drawer.Screen 
                    name='settings'
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings' // Set header title for Settings
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
};

export default TabsLayout;
