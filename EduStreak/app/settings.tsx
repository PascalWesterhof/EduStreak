import { Text, View, StyleSheet, Switch, SafeAreaView, ScrollView, Pressable } from "react-native";
import React, { useState } from 'react';

export default function Settings() {
      const [notificationsEnabled, setNotificationsEnabled] = useState(true);
      const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);

    return (
         <SafeAreaView style={styles.container}>
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
             </SafeAreaView>
        );
    };

const styles = StyleSheet.create({
  container:
  {
    flex: 1,
    backgroundColor: '#D1624A',
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
});