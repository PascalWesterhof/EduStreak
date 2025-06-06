import { MaterialIcons } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  Button,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from '../../constants/Colors';
import { AppNotification, usePushNotifications } from "./usePushNotifications"; // Assuming AppNotification is exported from the hook file

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { notifications } = usePushNotifications();

  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const onPressNotification = (item: AppNotification) => {
    setSelectedNotification(item);
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
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
    <View style={styles.safeArea}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={styles.headerRightPlaceholder} />
      </View>

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
            <Button title="Close" onPress={() => setModalVisible(false)} color={colors.accent}/>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  headerRightPlaceholder: {
    width: 24 + 10, // Matches menuButton padding + icon width for balance
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