import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function Settings() {
  const navigation = useNavigation();
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.outerContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <Text style={styles.header}>Settings</Text>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.box}>
            <Text style={styles.label}>Profile</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: "#D1624A", true: "#fff"}}
              thumbColor={notificationsEnabled ? "#fff" : "#fff"}
            />
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>AI Assistance</Text>
            <Switch
              value={aiAssistanceEnabled}
              onValueChange={setAiAssistanceEnabled}
              trackColor={{ false: "#D1624A", true: "#fff"}}
              thumbColor={notificationsEnabled ? "#fff" : "#fff"}
            />
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Appearance</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Gamification</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Privacy & Data</Text>
          </View>

          <View style={styles.box}>
            <Text style={styles.label}>Extras</Text>
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#D1624A',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    tintColor: 'white',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header:
  {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
    marginVertical: 20,
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
  label:
  {
    color: '#fff',
    fontSize: 16,
  },
  arrowIcon: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});