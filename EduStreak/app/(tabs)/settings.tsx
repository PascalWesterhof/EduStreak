import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';

/**
 * `Settings` component provides a screen for users to access various application settings.
 * Currently, it includes navigation to Profile Settings and placeholder toggles/links for 
 * Notifications, AI Assistance, Appearance, Privacy & Data, and Extras.
 * 
 * The actual functionality for the toggles (Notifications, AI Assistance) is not yet implemented
 * beyond managing their local state.
 */
export default function Settings() {
  const navigation = useNavigation(); // Hook for accessing navigation actions like opening the drawer.
  const router = useRouter(); // Hook for programmatic navigation (e.g., to profile settings).

  // State for the "Notifications Enabled" toggle switch. Default is true.
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  // State for the "AI Assistance Enabled" toggle switch. Default is true.
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);

  return (
    <SafeAreaView style={globalStyles.screenContainer}> 
      <StatusBar barStyle="light-content" />
      {/* Custom Header: Includes a menu button to open the drawer and a centered title. */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Settings</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />{/* Placeholder for balance if needed */}
      </View>
      
      {/* Main content area for settings items */}
      <View style={[globalStyles.contentContainer, styles.containerCustom]}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Profile Settings Navigation Item */}
          <TouchableOpacity onPress={() => router.push('/settings/profileSettings')} style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Profile</Text>
            <Text style={styles.arrowIcon}>{ '>'}</Text>{/* Navigation indicator */}
          </TouchableOpacity>

          {/* Notifications Toggle Item (Placeholder Functionality) */}
          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: colors.primary /* Or a more muted color for off state */, true: colors.accent /* Use accent for on state */}}
              thumbColor={notificationsEnabled ? colors.primaryText : '#f4f3f4'} // Standard thumb colors
              ios_backgroundColor="#3e3e3e" // Standard iOS background for switch
            />
          </View>

          {/* AI Assistance Toggle Item (Placeholder Functionality) */}
          <View style={styles.box}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>AI Assistance</Text>
            <Switch
              value={aiAssistanceEnabled}
              onValueChange={setAiAssistanceEnabled}
              trackColor={{ false: colors.primary, true: colors.accent}}
              thumbColor={aiAssistanceEnabled ? colors.primaryText : '#f4f3f4'}
              ios_backgroundColor="#3e3e3e"
            />
          </View>

          {/* Placeholder Settings Items (no navigation/action yet) */}
          <TouchableOpacity style={styles.box} onPress={() => alert('Appearance settings coming soon!')}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Appearance</Text>
            <Text style={styles.arrowIcon}>{ '>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.box} onPress={() => alert('Privacy & Data settings coming soon!')}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Privacy & Data</Text>
            <Text style={styles.arrowIcon}>{ '>'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.box} onPress={() => alert('Extra features coming soon!')}>
            <Text style={[globalStyles.bodyText, styles.labelCustom]}>Extras</Text>
            <Text style={styles.arrowIcon}>{ '>'}</Text>
          </TouchableOpacity>

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
    flex: 1, // Allows the title to take up space and be centered
    alignItems: 'center', // Centers the title text horizontally
  },
  headerTitleCustom: {
    color: colors.primaryText, 
    fontSize: 20, // Explicitly set font size if not covered by globalStyles.headerText
    fontWeight: 'bold', // Make title bold
  },
  headerRightPlaceholder: {
    width: 24 + 10, // Width of menu icon + its padding, for balance
  },
  containerCustom: {
    paddingHorizontal: 20,
    flex: 1, // Ensure the content container takes up available vertical space
  },
  content: {
    paddingBottom: 20, // Padding at the bottom of the scrollable content
  },
  box: {
    backgroundColor: colors.accent, // Using accent color for boxes, consider a more muted one from your theme if needed
    borderRadius: 8, // Slightly more rounded corners
    paddingVertical: 18, // Increased vertical padding for better touchability
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000", // Basic shadow for depth
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  labelCustom: {
    color: colors.primaryText, 
    fontSize: 16, // Standardize label font size
    fontWeight: '500', // Medium weight for labels
  },
  arrowIcon: {
    color: colors.primaryText, 
    fontSize: 20,
    fontWeight: 'bold',
  }
});