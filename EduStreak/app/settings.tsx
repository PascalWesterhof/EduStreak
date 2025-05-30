import { Text, View, StyleSheet, Switch, SafeAreaView, ScrollView, Pressable } from "react-native";
import React, { useState } from 'react';
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";

export default function Settings() {
      const [notificationsEnabled, setNotificationsEnabled] = useState(true);
      const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);

      const navigation = useNavigation();

    const onToggle = () =>
    {
        navigation.dispatch(DrawerActions.openDrawer());
    };
      useLayoutEffect(() => {
            navigation.setOptions({
                headerTitleStyle: {
                  color: '#fff',       // Your desired text color
                  fontSize: 24,        // Your desired font size
                  fontWeight: 'bold',

                },
                headerStyle: {
                  backgroundColor: '#D1624A', // Optional: white background
                },
             headerTintColor: '#fff'
              });
            }, [navigation]);

    return (
         <SafeAreaView style={styles.container}>
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
    borderRadius: 3,
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
});