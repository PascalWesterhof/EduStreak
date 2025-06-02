import React from 'react';
import 'react-native-gesture-handler';

import { FontAwesome } from '@expo/vector-icons';
import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../../components/CustomDrawerContent';

/**
 * `TabsLayout` defines the main navigation structure of the application using a Drawer navigator.
 * It configures the drawer's appearance, custom content, and lists all the screens 
 * accessible through the drawer menu (Home, Leaderboard, Calendar, Settings).
 * 
 * Each screen in the drawer is configured with a label, title, and an icon.
 * `GestureHandlerRootView` is used as the root component to ensure gesture handling
 * works correctly across the application, especially for the drawer.
 */
const TabsLayout = () =>
{
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Drawer 
                drawerContent={CustomDrawerContent}
                screenOptions={{
                    headerShown: false,
                    drawerActiveTintColor: 'white',
                    drawerInactiveTintColor: '#ccc',
                    drawerActiveBackgroundColor: '#D05B52',
                    drawerLabelStyle: { fontSize: 16 },
                    drawerItemStyle:
                    {
                          borderRadius: 12,
                          marginHorizontal: 8,
                    },
                    drawerStyle: {
                        backgroundColor: '#F4F6F8',
                    }
                   }}>
                <Drawer.Screen 
                    name='index'
                    options={{
                        drawerLabel: 'Home',
                        title: 'Home',
                        drawerIcon: ({ color, size }) => <FontAwesome name="home" size={size} color={color} />,
                    }}
                />
                <Drawer.Screen 
                    name='leaderboard'
                    options={{
                        drawerLabel: 'Leaderboard',
                        title: 'Leaderboard',
                        drawerIcon: ({ color, size }) => (
                            <FontAwesome name="trophy" size={size} color={color} />
                        ),
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
                <Drawer.Screen 
                    name='settings'
                    options={{
                        drawerLabel: 'Settings',
                        title: 'Settings',
                        drawerIcon: ({ color, size }) => <FontAwesome name="cog" size={size} color={color} />,
                    }}
                />
            </Drawer>
        </GestureHandlerRootView>
    );
};

export default TabsLayout;
