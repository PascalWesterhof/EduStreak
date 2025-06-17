import { useFonts } from "expo-font";
import { Link, useNavigation } from "expo-router";
import React, { useLayoutEffect, useState, useEffect,} from 'react';
import { Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View,} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllScheduledNotifications, scheduleDailyReminder } from './helpers/notificationReminder';

export default function Settings() {
        // State for notification toggle
        const [notificationsEnabled, setNotificationsEnabled] = useState(true);
            // State for daily reminders toggle
        const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true);
            // Load custom fonts asynchronously
        const [fontsLoaded] = useFonts({
          'DMSans-SemiBold': require('../assets/fonts/DMSans-SemiBold.ttf'),
          'Rubik-Medium': require('../assets/fonts/Rubik-Medium.ttf'),
          });

      const navigation = useNavigation();

    const onToggle = () =>
    {
        navigation.dispatch(DrawerActions.openDrawer());
    };
      useLayoutEffect(() => {
          if(fontsLoaded){
            navigation.setOptions({
                headerStyle: {
                    backgroundColor: '#D1624A', // Optional: white background
                },
             headerTintColor: '#fff'
              });
            }
        }, [navigation, fontsLoaded]);
    // Load notification preferences from AsyncStorage on component mount
      useEffect(() => {
        (async () => {
          const notifValue = await AsyncStorage.getItem("notificationsEnabled");
          const dailyValue = await AsyncStorage.getItem("dailyRemindersEnabled");
          console.log("Loaded from AsyncStorage: ", {
            notificationsEnabled: notifValue,
            dailyRemindersEnabled: dailyValue,
          });
              // Update state with parsed values if they exist
          if (notifValue !== null) setNotificationsEnabled(JSON.parse(notifValue));
          if (dailyValue !== null) setDailyRemindersEnabled(JSON.parse(dailyValue));
        })();
      }, []);
    // Handler to toggle notifications on/off
    const toggleNotifications = async (value: boolean) => {
        console.log("toggleNotifications called with:", value);
      setNotificationsEnabled(value);
      await AsyncStorage.setItem("notificationsEnabled", JSON.stringify(value));
      if (value) {
          console.log("Scheduling daily reminder");
        await scheduleDailyReminder();
      } else {
          console.log("Canceling all scheduled notifications");
        await cancelAllScheduledNotifications();
      }
    };
    // Handler to toggle daily reminders on/off
    const toggleDailyReminders = async (value: boolean) => {
        console.log("toggleNotifications called with:", value);
      setDailyRemindersEnabled(value);
      await AsyncStorage.setItem("dailyRemindersEnabled", JSON.stringify(value));
      if (value) {
          console.log("Scheduling daily reminder");
        await scheduleDailyReminder();
      } else {
          console.log("Canceling all scheduled notifications");
        await cancelAllScheduledNotifications();
      }
    };
    // Return null while fonts are loading to avoid UI glitches
        if(!fontsLoaded)
        {
            return null;
        }

    return (
         <SafeAreaView style={styles.container}>
               <ScrollView contentContainerStyle={styles.content}>
                 <View style={styles.header}>
                    <Text style={styles.headerText}>Settings</Text>
                 </View>
                 <View style={styles.box}>
                   <Link href="/settingsScreens/profileSettings" asChild>
                    <TouchableOpacity>
                      <Text style={styles.label}>Profile</Text>
                    </TouchableOpacity>
                  </Link>
                 </View>

                 <View style={styles.box}>
                   <Text style={styles.label}>Notifications</Text>
                   <Switch
                     value={notificationsEnabled}
                     onValueChange={toggleNotifications}
                     trackColor={{ false: "#D1624A", true: "#fff"}}
                     thumbColor={notificationsEnabled ? "#fff" : "#fff"}
                      style={Platform.OS === 'web' ? { accentColor: '#fff' } : {}}
                   />
                 </View>

                 <View style={styles.box}>
                   <Text style={styles.label}>Daily reminders</Text>
                   <Switch
                     value={dailyRemindersEnabled}
                     onValueChange={toggleDailyReminders}
                     trackColor={{ false: "#D1624A", true: "#fff"}}
                     thumbColor={notificationsEnabled ? "#fff" : "#fff"}

                   />
                 </View>

                 <View style={styles.box}>
                   <Link href="./appearance" asChild>
                    <TouchableOpacity>
                      <Text style={styles.label}>Appearance</Text>
                    </TouchableOpacity>
                  </Link>
                 </View>

                 <View style={styles.box}>
                    <Link href="./gamification" asChild>
                     <TouchableOpacity>
                       <Text style={styles.label}>Gamification</Text>
                     </TouchableOpacity>
                   </Link>
                 </View>

                 <View style={styles.box}>
                   <Link href="./privacy" asChild>
                    <TouchableOpacity>
                      <Text style={styles.label}>Privacy & Data</Text>
                    </TouchableOpacity>
                  </Link>
                 </View>

                 <View style={styles.box}>
                   <Text style={styles.label}>Extras</Text>
                 </View>
               </ScrollView>
             </SafeAreaView>
        );
    };

const styles = StyleSheet.create({
  container:
  {
    flex: 1,
    backgroundColor: '#D1624A',
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header:
  {
    color: '#DE7460',
    alignSelf: 'center',
    marginVertical: 20,
  },
    headerText:
    {
    fontFamily: 'DMSans-SemiBold',
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    },
  content:
  {
    paddingBottom: 20,
  },
  box:
  {
    backgroundColor: '#DE7460',
    borderRadius: 3,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label:
  {
    fontFamily: 'Rubik-Medium',
    color: '#fff',
    fontSize: 16,
  },
});