import {
  DrawerContentScrollView,
  DrawerItem,
  DrawerItemList
} from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React from 'react';
import {
  Alert,
  StyleSheet
} from 'react-native';
import { auth } from '../config/firebase';

const CustomDrawerContent = (props: any) => {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error("Logout Error: ", error);
      Alert.alert('Logout Failed', error.message);
    }
  };

  return (
    <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: 100 }}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Log out"
        onPress={handleLogout}
        labelStyle={styles.logoutItemLabelStyle}
      />
    </DrawerContentScrollView>
  );
};

const styles = StyleSheet.create({
  logoutItemLabelStyle: {
    color: 'red',
  },
});

export default CustomDrawerContent; 