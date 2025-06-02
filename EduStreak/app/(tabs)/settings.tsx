import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';

export default function Settings() {
  const navigation = useNavigation();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);

  return (
    <SafeAreaView style={globalStyles.screenContainer}> 
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Settings</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>
      <View style={[globalStyles.contentContainer, styles.containerCustom]}>
        <ScrollView contentContainerStyle={styles.content}>
          <TouchableOpacity onPress={() => router.push('/settings/profileSettings')} style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Profile</Text>
            <Text style={styles.arrowIcon}>{'>'}</Text>
          </TouchableOpacity>

          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.primary, true: colors.primaryText}}
              thumbColor={colors.primaryText}
            />
          </View>

          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>AI Assistance</Text>
            <Switch
              value={aiAssistanceEnabled}
              onValueChange={setAiAssistanceEnabled}
              trackColor={{ false: colors.primary, true: colors.primaryText}}
              thumbColor={colors.primaryText}
            />
          </View>

          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Appearance</Text>
          </View>

          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Privacy & Data</Text>
          </View>

          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Extras</Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.primaryText, 
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitleCustom: {
    color: colors.primaryText, 
  },
  headerRightPlaceholder: {
    width: 24 + 10,
  },
  containerCustom: {
    paddingHorizontal: 20,
  },
  content:
  {
    paddingBottom: 20,
  },
  box:
  {
    backgroundColor: '#DE7460',
    borderRadius: 6,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelCustom:
  {
    color: colors.primaryText, 
  },
  arrowIcon: {
    color: colors.primaryText, 
    fontSize: 20,
    fontWeight: 'bold',
  }
});