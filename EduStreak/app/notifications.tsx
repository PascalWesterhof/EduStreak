import { useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import { Text, View, StyleSheet, SafeAreaView, FlatList } from "react-native";
import { useLayoutEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { usePushNotifications } from "./usePushNotifications";

export default function NotificationsScreen() {
  const navigation = useNavigation();
  const { notifications } = usePushNotifications();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitleStyle: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
      },
      headerStyle: {
        backgroundColor: '#D1624A',
      },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  const renderItem = ({ item }) => (
    <View style={styles.notificationItem}>
      <MaterialIcons name="notifications-active" size={20} color="#fff" style={styles.icon} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.time}>{item.time}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {notifications.length === 0 ? (
        <View style={{ padding: 20 }}>
          <Text style={{ color: '#fff' }}>No notifications yet.</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#D1624A',
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f0c0b0',
    paddingVertical: 12,
  },
  icon: {
    marginRight: 12,
    marginTop: 4,
  },
  title: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  time: {
    color: '#f8d8c8',
    fontSize: 12,
  },
});
