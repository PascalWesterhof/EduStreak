import { Text, View, StyleSheet, Switch, SafeAreaView, ScrollView, Pressable, Alert, Button } from "react-native";
import React, { useState } from "react";
import { useLayoutEffect } from "react";
import { useNavigation } from "expo-router";
import { usePushNotifications } from "./usePushNotifications";
import { scheduleDailyHabitReminder, cancelAllNotifications } from "./helpers/notificationReminder";

export default function Settings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [aiAssistanceEnabled, setAiAssistanceEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const { expoPushToken } = usePushNotifications();

  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleStyle: {
        color: "#fff",
        fontSize: 24,
        fontWeight: "bold",
      },
      headerStyle: {
        backgroundColor: "#D1624A",
      },
      headerTintColor: "#fff",
    });
  }, [navigation]);

  const toggleReminders = async () => {
    const newValue = !remindersEnabled;
    setRemindersEnabled(newValue);

    if (newValue) {
      const reminderTime = new Date();
      reminderTime.setHours(20);
      reminderTime.setMinutes(0);
      await scheduleDailyHabitReminder("Study", reminderTime);
      Alert.alert("Reminders Enabled", "Daily reminder set for 8:00 PM");
    } else {
      await cancelAllNotifications();
      Alert.alert("Reminders Disabled", "All notifications cancelled.");
    }
  };

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
            trackColor={{ false: "#D1624A", true: "#fff" }}
            thumbColor={notificationsEnabled ? "#fff" : "#fff"}
          />
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>AI Assistance</Text>
          <Switch
            value={aiAssistanceEnabled}
            onValueChange={setAiAssistanceEnabled}
            trackColor={{ false: "#D1624A", true: "#fff" }}
            thumbColor={aiAssistanceEnabled ? "#fff" : "#fff"}
          />
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>Daily Habit Reminders</Text>
          <Switch
            value={remindersEnabled}
            onValueChange={toggleReminders}
            trackColor={{ false: "#aaa", true: "#D1624A" }}
            thumbColor={remindersEnabled ? "#fff" : "#ccc"}
          />
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>Push Token:</Text>
          <Text selectable style={styles.tokenText}>
            {expoPushToken?.data || "Not available"}
          </Text>
        </View>

        <Button
          title="Cancel All Notifications"
          color="#a33"
          onPress={async () => {
            await cancelAllNotifications();
            Alert.alert("Cancelled", "All scheduled notifications cleared.");
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#D1624A",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  content: {
    paddingBottom: 20,
  },
  box: {
    backgroundColor: "#DE7460",
    borderRadius: 3,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#fff",
    fontSize: 16,
  },
  tokenText: {
    fontSize: 12,
    color: "#555",
  },
});

