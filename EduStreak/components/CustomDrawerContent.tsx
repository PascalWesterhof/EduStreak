import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { signOut } from 'firebase/auth';
import { Alert, StyleSheet } from "react-native";
import { auth } from '../config/firebase';

export default function CustomDrawerContent(props: any) {
    return (
    <DrawerContentScrollView {...props} style={styles.container}>
        <DrawerItemList {...props} />
        <DrawerItem label={"Log out"} onPress={handleLogout} />
    </DrawerContentScrollView>
    );
}

const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout Error: ", error);
      Alert.alert('Logout Failed', error.message);
    }
  };


const styles = StyleSheet.create
    ({
        container:
        {
        drawerActiveTintColor: 'white',
        drawerActiveBackgroundColor: '#D05B52',
        },
        drawerLabelStyle:
        {
          color: 'red',
        },
    });