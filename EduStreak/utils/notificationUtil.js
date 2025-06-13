import * as Notifications from 'expo-notifications';
/**
 * Schedule a repeating daily habit reminder.
 */
export const scheduleDailyHabitReminder = async (habitName, time) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Habit Reminder',
        body: `Don't forget to complete "${habitName}" today!`,
        sound: true,
      },
      trigger: {
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: true,
      },
    });
  } catch (err) {
    console.error('Failed to schedule daily notification:', err);
  }
};

/**
 * Schedule a one-time missed habit reminder.
 */
export const scheduleLateHabitReminder = async (habitName, time) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Missed Habit',
        body: `You missed "${habitName}" yesterday. Let's restart today!`,
        sound: true,
      },
      trigger: {
        year: time.getFullYear(),
        month: time.getMonth() + 1,
        day: time.getDate(),
        hour: time.getHours(),
        minute: time.getMinutes(),
        repeats: false,
      },
    });
  } catch (err) {
    console.error('Failed to schedule late notification:', err);
  }
};

/**
 * Cancel all scheduled notifications.
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.error('Failed to cancel notifications:', err);
  }
};
