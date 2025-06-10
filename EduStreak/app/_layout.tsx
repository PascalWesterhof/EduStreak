import 'react-native-gesture-handler';

import { Drawer } from "expo-router/drawer";
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../components/CustomDrawerContent';

const DrawerLayout = () =>
{
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
                options={{drawerLabel: 'Home', headerTitle: 'Home'}}/>
                <Drawer.Screen name='calendar'
                options={{drawerLabel: 'Calendar', headerTitle: 'Calendar', headerShown: true}}/>
                <Drawer.Screen name='notifications'
                options={{drawerLabel: 'Notifications', headerTitle: 'Notifications', headerShown: true}}/>
                <Drawer.Screen name='leaderboard'
                options={{drawerLabel: 'Leaderboard', headerTitle: 'Leaderboard', headerShown: false}}/>
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

