import { Text, View, StyleSheet, Switch, SafeAreaView, ScrollView, Pressable, TouchableOpacity, Platform } from "react-native";
import React, { useState } from 'react';
import { useLayoutEffect } from "react";
import { useNavigation, Link } from "expo-router";
import { useFonts } from "expo-font";

export default function Settings() {
      const [notificationsEnabled, setNotificationsEnabled] = useState(true);
      const [dailyRemindersEnabled, setDailyRemindersEnabled] = useState(true);

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
                   <Text style={styles.label}>Profile</Text>
                 </View>

                 <View style={styles.box}>
                   <Text style={styles.label}>Notifications</Text>
                   <Switch
                     value={notificationsEnabled}
                     onValueChange={setNotificationsEnabled}
                     trackColor={{ false: "#D1624A", true: "#fff"}}
                     thumbColor={notificationsEnabled ? "#fff" : "#fff"}
                      style={Platform.OS === 'web' ? { accentColor: '#fff' } : {}}
                   />
                 </View>

                 <View style={styles.box}>
                   <Text style={styles.label}>Daily reminders</Text>
                   <Switch
                     value={dailyRemindersEnabled}
                     onValueChange={setDailyRemindersEnabled}
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