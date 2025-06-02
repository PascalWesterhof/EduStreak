import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
// Firebase SDK imports to be removed or reduced
// import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth } from '../../config/firebase'; // db import will be removed
import { colors } from '../../constants/Colors';
import {
    clearAllUserNotifications as clearAllService,
    markNotificationAsRead as markReadService,
    subscribeToNotifications
} from '../../services/notificationService';
import { globalStyles } from '../../styles/globalStyles';
import { InAppNotification } from '../../types';

/**
 * `NotificationsScreen` displays a list of in-app notifications for the current user.
 * It subscribes to real-time updates from the `notificationService`.
 * Users can mark individual notifications as read or clear all notifications.
 * Handles loading states and displays a message if there are no notifications.
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = auth.currentUser?.uid;

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) {
        setNotifications([]);
        setIsLoading(false);
        // Optionally, display a message or redirect if no user
        return;
      }

      setIsLoading(true);
      
      const handleUpdate = (fetchedNotifications: InAppNotification[]) => {
        setNotifications(fetchedNotifications);
        setIsLoading(false);
      };

      const handleError = (error: Error) => {
        console.error("[NotificationsScreen] Error from service subscription: ", error);
        setIsLoading(false);
        // Optionally, set an error state to display a message to the user
      };

      // Use the service to subscribe
      const unsubscribe = subscribeToNotifications(currentUserId, handleUpdate, handleError);

      return () => unsubscribe(); // Cleanup subscription on blur or unmount
    }, [currentUserId])
  );

  /**
   * Marks a specific notification as read.
   * Calls the `markReadService` to update the notification's status in Firestore.
   * Optimistically updates the local state to reflect the change immediately.
   * Displays an alert if the operation fails.
   * @param {string} notificationId - The ID of the notification to mark as read.
   */
  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUserId) return;
    try {
      // Call service to mark as read
      await markReadService(currentUserId, notificationId);
      // Optimistic update or rely on onSnapshot to refresh
      setNotifications(prevNotifications =>
        prevNotifications.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error: any) {
      console.error("[NotificationsScreen] Error marking notification as read via service: ", error);
      Alert.alert("Error", error.message || "Could not mark notification as read.");
    }
  };

  /**
   * Clears all notifications for the current user.
   * Prompts the user for confirmation before proceeding.
   * Calls the `clearAllService` to delete all notifications from Firestore.
   * Optimistically clears the local notifications state.
   * Manages loading state and displays alerts for success or failure.
   */
  const handleClearAllNotifications = async () => {
    if (!currentUserId || notifications.length === 0) return;

    Alert.alert(
      "Confirm Clear",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All", 
          style: "destructive", 
          onPress: async () => {
            setIsLoading(true);
            try {
              // Call service to clear all notifications
              await clearAllService(currentUserId);
              // Optimistic update or rely on onSnapshot to refresh (which should show empty list)
              setNotifications([]); 
            } catch (error: any) {
              console.error("[NotificationsScreen] Error clearing all notifications via service: ", error);
              Alert.alert("Error", error.message || "Could not clear notifications. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  /**
   * Renders a single notification item for the FlatList.
   * Displays the notification message and timestamp.
   * Unread notifications have distinct styling and an unread indicator dot.
   * Pressing an item triggers `handleMarkAsRead` for that notification.
   * @param {object} params - The parameters for rendering the item.
   * @param {InAppNotification} params.item - The notification object to render.
   * @returns {JSX.Element} The rendered notification item.
   */
  const renderNotificationItem = ({ item }: { item: InAppNotification }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadItemCustom]}
      onPress={() => handleMarkAsRead(item.id)}
    >
      <Text style={[globalStyles.bodyText, styles.notificationMessageCustom]}>{item.message}</Text>
      <Text style={[globalStyles.mutedText, styles.notificationTimestampCustom]}>
        {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
      {!item.read && <View style={styles.unreadDotView} />}
    </TouchableOpacity>
  );

  if (isLoading) {
    return <View style={[globalStyles.centeredContainer, styles.loaderContainerCustom]}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  return (
    <View style={[globalStyles.screenContainer, styles.containerCustom]}>
        <View style={styles.headerContainer}>
            <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backButton}>
                 <Text style={[globalStyles.bodyText, styles.backButtonTextCustom]}>Back</Text>
            </TouchableOpacity>
            <Text style={[globalStyles.titleText, styles.headerTitleCustom]}>Notifications</Text>
            {notifications.length > 0 ? (
              <TouchableOpacity onPress={handleClearAllNotifications} style={styles.clearAllButton}>
                <Text style={[globalStyles.bodyText, styles.clearAllButtonTextCustom]}>Clear All</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.clearAllButtonPlaceholder} />
            )}
        </View>

      {notifications.length === 0 && !isLoading ? (
        <Text style={[globalStyles.bodyText, styles.emptyTextCustom]}>You have no notifications.</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  containerCustom: {
    backgroundColor: colors.lightGray,
  },
  loaderContainerCustom: {
    backgroundColor: colors.lightGray,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
    minWidth: 70,
    alignItems: 'flex-start',
  },
  backButtonTextCustom: {
    color: colors.primary,
  },
  headerTitleCustom: {
    color: colors.textDefault,
    textAlign: 'center',
    flex:1,
  },
  clearAllButton: {
    paddingVertical: 10,
    paddingHorizontal: 5, 
    minWidth: 70,
    alignItems: 'flex-end',
  },
  clearAllButtonPlaceholder: {
    width: 70,
  },
  clearAllButtonTextCustom: {
    color: colors.primary,
    fontWeight: '500',
  },
  listContentContainer: {
    paddingHorizontal: globalStyles.contentContainer.padding,
    paddingBottom: 20,
  },
  notificationItem: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: globalStyles.contentContainer.padding,
    borderWidth: 1,
    borderColor: colors.borderColor,
    flexDirection: 'column',
    position: 'relative',
  },
  unreadItemCustom: {
    backgroundColor: colors.unreadItemBackground,
    borderColor: colors.primary,
  },
  notificationMessageCustom: {
    marginBottom: 5,
  },
  notificationTimestampCustom: {
  },
  unreadDotView: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    position: 'absolute',
    top: 10,
    right: 10,
  },
  emptyTextCustom: {
    textAlign: 'center',
    marginTop: 50,
    color: colors.textMuted,
  }
}); 