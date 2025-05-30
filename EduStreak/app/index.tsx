/*
useEffect(() => {
  const fetchStats = async () => {
    setLoading(true);
    const stats = await getHabitStats(userId, habitId);
    if (stats) setStats(stats);
    setLoading(false);
  };
  fetchStats();
}, [userId, habitId]);


*/
import React from 'react';
import { SafeAreaView } from 'react-native';
import StatsScreen from './statsScreen';

export default function Index() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatsScreen userId="test_user" habitId="reading" />
    </SafeAreaView>
  );
}

/*
import React, { useEffect } from "react";
import { View, Text, StyleSheet, Platform, Alert } from "react-native";
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import usePushNotifications from "./usePushNotifications";

export default function App() {
    const {exportPushToken, notirfication} = usePushNotifications()

    const data = JSON.stringify(notification, undefined, 2);

    return (
        <View style={styles.container}>
            <Text>Token: {exportPushToken?.data ?? ""}</Text>
            <Text>{data}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
});

*/

