import 'react-native-gesture-handler';

import { Stack } from "expo-router";
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
                   }}>
                <Drawer.Screen name='index'
                options={{drawerLabel: 'Home'}}/>
                <Drawer.Screen name='calendar'
                options={{drawerLabel: 'Calendar'}}/>
                <Drawer.Screen name='notifications'
                options={{drawerLabel: 'Notifications'}}/>
                <Drawer.Screen name='settings'
                options={{drawerLabel: 'Settings'}}/>
            </Drawer>
        </GestureHandlerRootView>
    );
};

export default DrawerLayout;
