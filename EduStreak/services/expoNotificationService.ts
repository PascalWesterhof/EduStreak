import * as Notifications from 'expo-notifications';

/**
 * Represents the time for a notification.
 */
interface NotificationTime {
  getHours: () => number;
  getMinutes: () => number;
  getDate?: () => number;
  getMonth?: () => number;      // Should be 0-indexed (0 for January, 11 for December)
  getFullYear?: () => number;
}

/*
  Schedule a repeating daily habit reminder.

  @param {string} habitName - Name of the habit.
  @param {NotificationTime} time - Time of day to send the notification (local time).
 */
export const scheduleDailyHabitReminder = async (habitName: string, time: NotificationTime): Promise<void> => {
  try {
    const trigger: any = {
        // Using the original structure that was provided, cast to any to bypass TS error for now
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      };
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit reminder',
        body: `Don't forget to complete "${habitName}" today!`,
        sound: true,
      },
      trigger: trigger, // Cast to any
    });
    console.log(`[ExpoNotificationService] Daily reminder scheduled for "${habitName}" at ${time.getHours()}:${time.getMinutes()}.`);
  } catch (err) {
    console.error('[ExpoNotificationService] Failed to schedule daily notification:', err);
  }
};

/*
  Schedule a one-time reminder if the user missed a habit (e.g., next morning).

  @param {string} habitName - Name of the habit.
  @param {NotificationTime} time - Exact date and time to send the reminder.
 */
export const scheduleLateHabitReminder = async (habitName: string, time: NotificationTime): Promise<void> => {
  try {
    if (typeof time.getDate !== 'function' || typeof time.getMonth !== 'function' || typeof time.getFullYear !== 'function') {
        console.error('[ExpoNotificationService] Invalid time object for late habit reminder. Must include getDate, getMonth, and getFullYear.');
        return;
    }

    const triggerDate = new Date();
    triggerDate.setFullYear(time.getFullYear!());
    triggerDate.setMonth(time.getMonth!());
    triggerDate.setDate(time.getDate!());
    triggerDate.setHours(time.getHours());
    triggerDate.setMinutes(time.getMinutes());
    triggerDate.setSeconds(0);
    triggerDate.setMilliseconds(0);

    if (triggerDate.getTime() <= Date.now()) {
        console.warn(`[ExpoNotificationService] Attempted to schedule a late reminder for "${habitName}" in the past. Notification not scheduled.`);
        return;
    }
    
    const trigger: any = triggerDate; // Cast to any

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Missed Habit',
        body: `You missed "${habitName}" yesterday. Let's restart today!`,
        sound: true,
      },
      trigger: trigger, // Cast to any
    });
    console.log(`[ExpoNotificationService] Late reminder scheduled for "${habitName}" at ${triggerDate.toISOString()}.`);
  } catch (err) {
    console.error('[ExpoNotificationService] Failed to schedule late notification:', err);
  }
};

/*
  Cancel all scheduled notifications for the app.
 */
export const cancelAllNotifications = async (): Promise<void> => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('[ExpoNotificationService] All scheduled notifications cancelled.');
  } catch (err) {
    console.error('[ExpoNotificationService] Failed to cancel notifications:', err);
  }
}; 