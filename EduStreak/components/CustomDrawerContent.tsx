import { DrawerContentScrollView, DrawerItemList, DrawerItem } from "@react-navigation/drawer";
import { useRouter } from "expo-router";
import { StyleSheet, View } from "react-native";

export default function CustomDrawerContent(props: any) {
    return (
    <DrawerContentScrollView {...props} style={styles.container}>
        <DrawerItemList {...props} />
        <DrawerItem label={"Log out"} onPress={() => router.replace('/')} style={styles.drawerLabelStyle} />
    </DrawerContentScrollView>
    );
}

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