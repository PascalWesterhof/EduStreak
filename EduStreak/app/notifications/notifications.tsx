import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { collection, doc, getDocs, onSnapshot, orderBy, query, updateDoc, writeBatch } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { auth, db } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';
import { InAppNotification } from '../../types';

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
        return;
      }

      setIsLoading(true);
      const notificationsCollectionRef = collection(db, 'users', currentUserId, 'inAppNotifications');
      const q = query(notificationsCollectionRef, orderBy('timestamp', 'desc'));

      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedNotifications: InAppNotification[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          fetchedNotifications.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp, 
            read: data.read,
          } as InAppNotification);
        });
        setNotifications(fetchedNotifications);
        setIsLoading(false);
      }, (error) => {
        console.error("Error fetching notifications: ", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    }, [currentUserId])
  );

  const handleMarkAsRead = async (notificationId: string) => {
    if (!currentUserId) return;
    const notificationRef = doc(db, 'users', currentUserId, 'inAppNotifications', notificationId);
    try {
      await updateDoc(notificationRef, { read: true });
      setNotifications(prevNotifications =>
        prevNotifications.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  };

  const handleClearAllNotifications = async () => {
    if (!currentUserId || notifications.length === 0) return;

    Alert.alert(
      "Confirm Clear",
      "Are you sure you want to delete all notifications? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              const notificationsCollectionRef = collection(db, 'users', currentUserId, 'inAppNotifications');
              const querySnapshot = await getDocs(notificationsCollectionRef);
              
              if (querySnapshot.empty) {
                setNotifications([]);
                setIsLoading(false);
                return;
              }

              const batch = writeBatch(db);
              querySnapshot.forEach(doc => {
                batch.delete(doc.ref);
              });
              await batch.commit();
              setNotifications([]);
            } catch (error) {
              console.error("Error clearing all notifications: ", error);
              Alert.alert("Error", "Could not clear notifications. Please try again.");
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

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