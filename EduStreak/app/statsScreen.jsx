import React, { useState, useLayoutEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Modal,
  Pressable,
  Button,
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { usePushNotifications } from "./usePushNotifications";

export default function NotificationsScreen() {//show
  const navigation = useNavigation();
  const { expoPushToken, notifications } = usePushNotifications();

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

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

  const onPressNotification = (item) => {
    setSelectedNotification(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <Pressable onPress={() => onPressNotification(item)} style={styles.notificationItem}>
      <MaterialIcons
        name="notifications-active"
        size={20}
        color="#fff"
        style={styles.icon}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {notifications.length === 0 ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: "#fff" }}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal for full notification details */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <ScrollView style={{ maxHeight: 300 }}>
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
              <Text style={styles.modalBody}>
                {selectedNotification?.body || "No additional content"}
              </Text>
            </ScrollView>
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#D1624A",
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: "#f0c0b0",
    paddingVertical: 12,
  },
  icon: {
    marginRight: 12,
    marginTop: 4,
  },
  title: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    color: "#f8d8c8",
    fontSize: 12,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    marginHorizontal: 20,
    borderRadius: 10,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  modalBody: {
    fontSize: 16,
    marginBottom: 20,
  },
});
