import { scheduleDailyHabitReminder, scheduleLateHabitReminder } from '../../utils/notificationUtil';

/**
 * Called when a new habit is created.
 */
export const onHabitCreated = async (habit) => {
  try {
    const reminderTime = new Date();
    reminderTime.setHours(9, 0, 0, 0); // Default to 9:00 AM

    await scheduleDailyHabitReminder(habit.name, reminderTime);
    console.log(`Scheduled daily reminder for "${habit.name}"`);
  } catch (err) {
    console.error(`Failed to schedule daily reminder for "${habit.name}":`, err);
  }
};

/**
 * Checks for missed habits and schedules a next-morning reminder.
 */
export const remindMissedHabits = async (habits) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    for (const habit of habits) {
      const completedToday = habit.completionHistory?.some(
        (entry) => entry.date === today
      );

      if (!completedToday) {
        const nextMorning = new Date();
        nextMorning.setDate(nextMorning.getDate() + 1);
        nextMorning.setHours(9, 0, 0, 0);

        await scheduleLateHabitReminder(habit.name, nextMorning);
        console.log(`Scheduled late reminder for missed habit "${habit.name}"`);
      }
    }
  } catch (err) {
    console.error('Failed to schedule late reminders:', err);
  }
};
