import { DrawerContentScrollView, DrawerItem, DrawerItemList } from "@react-navigation/drawer";
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, Text, View } from "react-native";
import { auth } from '../config/firebase';
import { useTheme } from '../functions/themeFunctions/themeContext';
import { ColorScheme } from '../../constants/Colors'; //

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  contentScrollView: {
    flex: 1,
  },
  headerContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    marginBottom: 10,
  },
  headerText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  logoutItem: {
    marginTop: 20,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  logoutLabel: {
    color: colors.text,
    fontWeight: 'bold',
  },
});

export default function CustomDrawerContent(props: any) {
    const { colors: themeColors } = useTheme();
    const router = useRouter();

    const styles = useMemo(() => getStyles(themeColors), [themeColors]);

    const handleLogout = async () => {
        try {
          await signOut(auth);
          props.navigation.closeDrawer();
          router.replace('/auth/LoginScreen');
        } catch (error: any) {
          console.error("Logout Error: ", error);
          Alert.alert('Logout Failed', error.message);
        }
    };

    return (
        <DrawerContentScrollView
            {...props}
            style={styles.contentScrollView}>
            <View style={styles.headerContainer}>
                <Text style={styles.headerText}>EduStreak</Text>
            </View>

           <DrawerItemList {...props} />

            <DrawerItem
                label={"Log Out"}
                onPress={handleLogout}
                style={styles.logoutItem}
                labelStyle={styles.logoutLabel}
               />
        </DrawerContentScrollView>
    );
}