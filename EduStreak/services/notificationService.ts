import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { InAppNotification } from '../types';

/**
 * Subscribes to real-time updates for a user's in-app notifications from Firestore.
 * Notifications are typically ordered by timestamp in descending order.
 *
 * @param userId The ID of the user whose notifications are to be subscribed to.
 * @param onUpdate A callback function that is invoked with an array of `InAppNotification` objects
 *                 whenever there is an update (initial data or subsequent changes).
 * @param onError A callback function that is invoked if an error occurs during the subscription
 *                or data fetching process.
 * @returns An unsubscribe function that can be called to detach the real-time listener.
 *          Returns a no-op function if initial validation (db, userId) fails.
 */
export const subscribeToNotifications = (
  userId: string,
  onUpdate: (notifications: InAppNotification[]) => void,
  onError: (error: Error) => void
): (() => void) => {
  if (!db || !userId) {
    onError(new Error("[NotificationService] Firestore (db) not available or no user ID provided for subscribeToNotifications."));
    return () => {}; // Return a no-op unsubscribe function to prevent errors if called.
  }

  const notificationsCollectionRef = collection(db, 'users', userId, 'inAppNotifications');
  const q = query(notificationsCollectionRef, orderBy('timestamp', 'desc'));

  const unsubscribe = onSnapshot(q, 
    (querySnapshot) => {
      const fetchedNotifications: InAppNotification[] = [];
      querySnapshot.forEach((docSn) => {
        const data = docSn.data();
        // Ensure timestamp is consistently handled.
        // If Firestore Timestamp, convert to ISO string. Otherwise, use as is.
        const timestamp = data.timestamp instanceof Timestamp 
                          ? data.timestamp.toDate().toISOString() 
                          : data.timestamp;
        fetchedNotifications.push({
          id: docSn.id,
          ...data,
          timestamp, // Use the processed timestamp
          read: data.read === undefined ? false : data.read, // Default 'read' to false if not present
        } as InAppNotification);
      });
      onUpdate(fetchedNotifications);
    },
    (error) => {
      console.error("[NotificationService] Error in onSnapshot (subscribeToNotifications):", error);
      onError(error);
    }
  );

  return unsubscribe; // Return the actual Firebase unsubscribe function.
};

/**
 * Marks a specific in-app notification as read in Firestore.
 *
 * @param userId The ID of the user who owns the notification.
 * @param notificationId The ID of the notification to mark as read.
 * @returns A Promise that resolves when the update is successful.
 * @throws Throws an error if Firestore operation fails or if parameters are missing.
 */
export const markNotificationAsRead = async (userId: string, notificationId: string): Promise<void> => {
  if (!db || !userId || !notificationId) {
    console.error("[NotificationService] Missing parameters for markNotificationAsRead (db, userId, or notificationId).");
    throw new Error("Missing parameters for marking notification as read.");
  }
  const notificationRef = doc(db, 'users', userId, 'inAppNotifications', notificationId);
  try {
    await updateDoc(notificationRef, { read: true });
    console.log("[NotificationService] Notification marked as read in Firestore. ID:", notificationId);
  } catch (error) {
    console.error("[NotificationService] Error in markNotificationAsRead:", error);
    throw error; 
  }
};

/**
 * Clears all in-app notifications for a specific user from Firestore using a batch write.
 *
 * @param userId The ID of the user whose notifications are to be cleared.
 * @returns A Promise that resolves when all notifications are successfully deleted.
 * @throws Throws an error if Firestore operation fails or if userId is missing.
 */
export const clearAllUserNotifications = async (userId: string): Promise<void> => {
  if (!db || !userId) {
    console.error("[NotificationService] Missing userId for clearAllUserNotifications.");
    throw new Error("Missing userId for clearing notifications.");
  }
  
  const notificationsCollectionRef = collection(db, 'users', userId, 'inAppNotifications');
  try {
    const querySnapshot = await getDocs(notificationsCollectionRef);
    if (querySnapshot.empty) {
      console.log("[NotificationService] No notifications to clear for user:", userId);
      return; // No action needed if there are no notifications.
    }

    const batch = writeBatch(db); // Initialize a new batch operation.
    querySnapshot.forEach(docSn => {
      batch.delete(docSn.ref); // Add each document deletion to the batch.
    });
    await batch.commit(); // Commit the batch to execute all deletions atomically.
    console.log("[NotificationService] All notifications successfully cleared for user:", userId);
  } catch (error) {
    console.error("[NotificationService] Error in clearAllUserNotifications:", error);
    throw error; 
  }
}; 