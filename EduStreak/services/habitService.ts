import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase'; // auth removed as it's not used in this file directly yet
import { Habit, InAppNotification } from '../types';
import { getIsoDateString } from '../utils/dateUtils';

/**
 * Fetches all habits and in-app notifications for a given user.
 * Also calculates the count of unread notifications.
 * @param userId The ID of the user whose data is to be fetched.
 * @returns A Promise resolving to an object containing habits, notifications, and unreadCount.
 *          Returns empty arrays and zero count if an error occurs or if data is not found.
 */
export const fetchUserHabitsAndNotifications = async (userId: string): Promise<{ habits: Habit[], notifications: InAppNotification[], unreadCount: number }> => {
  if (!db || typeof userId !== 'string') {
    console.error("[HabitService] Firestore (db) not available or userId is not a string for fetchUserHabitsAndNotifications.");
    return { habits: [], notifications: [], unreadCount: 0 };
  }

  try {
    // Fetch Habits
    const habitsCollectionRef = collection(db, 'users', userId, 'habits');
    const habitsQuery = query(habitsCollectionRef);
    const habitsSnapshot = await getDocs(habitsQuery);
    const fetchedHabits: Habit[] = habitsSnapshot.docs.map(docSn => {
      const data = docSn.data();
      return {
        id: docSn.id,
        ...data,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        completionHistory: (data.completionHistory || []).map((entry: any) => ({
          date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : String(entry.date).split('T')[0],
          count: typeof entry.count === 'number' ? entry.count : (entry.completed ? 1 : 0),
        })),
      } as Habit;
    });

    // Fetch In-App Notifications
    const notificationsCollectionRef = collection(db, 'users', userId, 'inAppNotifications');
    // Consider ordering by timestamp in descending order if needed by default
    const notificationsQuery = query(notificationsCollectionRef, /* orderBy('timestamp', 'desc') */);
    const notificationsSnapshot = await getDocs(notificationsQuery);
    let unreadCount = 0;
    const fetchedNotifications: InAppNotification[] = notificationsSnapshot.docs.map(docSn => {
      const data = docSn.data();
      const notification: InAppNotification = {
        id: docSn.id,
        ...data,
        timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
        // Ensure 'read' field defaults to false if not present, though Firestore rules/defaults are better
        read: data.read === undefined ? false : data.read 
      } as InAppNotification;
      if (!notification.read) unreadCount++;
      return notification;
    });
    return { habits: fetchedHabits, notifications: fetchedNotifications, unreadCount };

  } catch (error) {
    console.error("[HabitService] Error in fetchUserHabitsAndNotifications: ", error);
    return { habits: [], notifications: [], unreadCount: 0 };
  }
};

/**
 * Adds a new habit to Firestore for the specified user.
 * Initializes streak, longestStreak, and completionHistory for the new habit.
 * @param userId The ID of the user to add the habit for.
 * @param newHabitData An object containing the details of the new habit, excluding fields like id, streak etc.
 * @returns A Promise that resolves with the fully formed Habit object (including new ID and initial values).
 * @throws Throws an error if the Firestore operation fails.
 */
export const addNewHabit = async (
  userId: string, 
  newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt'>
): Promise<Habit> => {
  if (!db || !userId) {
    throw new Error("[HabitService] Firestore (db) not available or no user ID provided for addNewHabit.");
  }
  const newHabitId = uuidv4(); // Generate a unique ID for the new habit
  const newHabit: Habit = {
    ...newHabitData,
    id: newHabitId, 
    streak: 0,
    longestStreak: 0,
    completionHistory: [],
    createdAt: new Date().toISOString(),
  };

  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', newHabitId);
    // Explicitly define the data to save to ensure type safety and avoid extra fields
    const dataToSave: any = {
      name: newHabit.name,
      frequency: newHabit.frequency,
      streak: newHabit.streak,
      longestStreak: newHabit.longestStreak,
      completionHistory: newHabit.completionHistory, // Should be empty array initially
      createdAt: Timestamp.fromDate(new Date(newHabit.createdAt)),
      isDefault: newHabit.isDefault || false, // Default to false if not provided
    };
    // Add optional fields only if they exist in newHabit
    if (newHabit.description !== undefined) dataToSave.description = newHabit.description;
    if (newHabit.notes !== undefined) dataToSave.notes = newHabit.notes;
    if (newHabit.reminderTime !== undefined) dataToSave.reminderTime = newHabit.reminderTime;

    await setDoc(habitDocRef, dataToSave);
    console.log("[HabitService] Habit added to Firestore with ID: ", newHabitId);
    return newHabit; 
  } catch (error) {
    console.error("[HabitService] Error in addNewHabit: ", error);
    throw error; 
  }
};

/**
 * Records a completion for a habit on a specific date.
 * Updates the habit's completion history in Firestore.
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to complete.
 * @param selectedDateStr The date of completion in ISO string format (YYYY-MM-DD).
 * @param currentHabitsState The current array of all habits from the component's state.
 *                           This is used to find the habit and its current completion history to avoid extra reads.
 * @returns A Promise resolving to an object indicating if the habit completion count was incremented,
 *          if the habit became fully completed for the day, and the updated habit object (or original if no change).
 * @throws Throws an error if the habit is not found or if the Firestore update fails.
 */
export const completeHabitLogic = async (
  userId: string, 
  habitId: string, 
  selectedDateStr: string, 
  currentHabitsState: Habit[] 
): Promise<{ 
  updatedHabit?: Habit, 
  habitBecameFullyCompleted: boolean, 
  wasIncremented: boolean 
}> => {
  let wasIncremented = false;
  let habitBecameFullyCompleted = false;
  let finalUpdatedHabit: Habit | undefined = undefined;

  const habitToUpdateIndex = currentHabitsState.findIndex(h => h.id === habitId);
  if (habitToUpdateIndex === -1) {
    console.error("[HabitService] Habit to complete not found in provided currentHabitsState for ID:", habitId);
    throw new Error("Habit not found for completion in local state.");
  }

  const originalHabit = currentHabitsState[habitToUpdateIndex];
  // Deep copy to avoid mutating the state directly before Firestore confirmation
  const newCompletionHistory = JSON.parse(JSON.stringify(originalHabit.completionHistory || []));

  const entryIndex = newCompletionHistory.findIndex((entry: any) => entry.date === selectedDateStr);
  // For weekly habits, targetCompletions is usually 1 for the day. For daily, it's frequency.times.
  const targetCompletions = originalHabit.frequency.type === 'daily' ? (originalHabit.frequency.times || 1) : 1;
  let currentCompletionsOnSelectedDate = 0;

  if (entryIndex > -1) {
    currentCompletionsOnSelectedDate = newCompletionHistory[entryIndex].count || 0;
    if (currentCompletionsOnSelectedDate < targetCompletions) {
      newCompletionHistory[entryIndex].count += 1;
      wasIncremented = true;
      if (newCompletionHistory[entryIndex].count >= targetCompletions) {
        habitBecameFullyCompleted = true;
      }
    }
  } else {
    newCompletionHistory.push({ date: selectedDateStr, count: 1 });
    wasIncremented = true;
    if (1 >= targetCompletions) {
      habitBecameFullyCompleted = true;
    }
  }

  if (wasIncremented) {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    try {
      // Ensure completion history entries are plain objects for Firestore
      const firestoreCompletionHistory = newCompletionHistory.map((e: { date: string; count: number; }) => ({date: e.date, count: e.count}));
      await updateDoc(habitDocRef, { completionHistory: firestoreCompletionHistory });
      console.log(`[HabitService] Habit ${habitId} completion history updated for ${selectedDateStr}`);
      
      finalUpdatedHabit = { ...originalHabit, completionHistory: newCompletionHistory };

    } catch (error) {
      console.error("[HabitService] Error in completeHabitLogic (Firestore update): ", error);
      throw error; 
    }
  } else {
    finalUpdatedHabit = originalHabit; 
  }
  
  return { updatedHabit: finalUpdatedHabit, habitBecameFullyCompleted, wasIncremented };
};

/**
 * Checks all scheduled habits for the current day and updates the user's daily streak in Firestore
 * if all are completed. This function is typically called after a habit completion.
 * @param userId The ID of the current user.
 * @param habitsForStreakCheck An array of all the user's habits to check for completion.
 */
export const updateDailyStreakLogic = async (userId: string, habitsForStreakCheck: Habit[]): Promise<void> => {
  if (!userId) {
    console.warn("[HabitService] No userId provided for updateDailyStreakLogic.");
    return;
  }

  const todayStr = getIsoDateString(new Date());
  let allTodaysHabitsCompleted = true;

  // Filter habits that are scheduled for today
  const todaysScheduledHabits = habitsForStreakCheck.filter(h => {
    const dayOfWeek = new Date().getDay(); // Sunday - 0, Monday - 1, etc.
    if (h.frequency.type === 'daily') return true;
    if (h.frequency.type === 'weekly') return h.frequency.days?.includes(dayOfWeek);
    return false;
  });

  if (todaysScheduledHabits.length === 0) {
    return; 
  }

  for (const habit of todaysScheduledHabits) {
    const targetCompletions = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1;
    const todaysEntry = (habit.completionHistory || []).find(entry => entry.date === todayStr);
    if (!todaysEntry || todaysEntry.count < targetCompletions) {
      allTodaysHabitsCompleted = false;
      break;
    }
  }

  if (allTodaysHabitsCompleted) {
    const userDocRef = doc(db, "users", userId);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        let newCurrentStreak = userData.currentStreak || 0;
        let newLongestStreak = userData.longestStreak || 0;
        const lastCompletionDate = userData.lastCompletionDate; // Assumes this is stored as YYYY-MM-DD string

        if (lastCompletionDate !== todayStr) { // Only update if streak hasn't been updated today
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getIsoDateString(yesterday);

          if (lastCompletionDate === yesterdayStr) {
            newCurrentStreak += 1;
          } else {
            // If last completion wasn't yesterday, streak resets to 1 (for today's completion)
            newCurrentStreak = 1; 
          }
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }
          await updateDoc(userDocRef, {
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastCompletionDate: todayStr 
          });
          console.log(`[HabitService] User ${userId} daily streak updated to ${newCurrentStreak}. Longest: ${newLongestStreak}.`);
        } 
      }
    } catch (error) {
      console.error("[HabitService] Error in updateDailyStreakLogic (Firestore update): ", error);
      // Not re-throwing, as this is a background-like update; component doesn't need to crash.
    }
  }
};

/**
 * Checks habits with reminder times and creates an in-app notification if a habit is due and not yet completed today.
 * Only creates one notification per call if multiple are due, to avoid flooding.
 * @param userId The ID of the current user.
 * @param habits An array of the user's habits.
 * @param existingNotifications An array of the user's existing in-app notifications (to prevent duplicates for the day).
 * @param selectedDate The date currently selected/viewed in the app (used to ensure reminders are for today).
 * @returns A Promise resolving to the newly created InAppNotification object if one was made, otherwise null.
 */
export const checkAndCreateReminderNotificationsLogic = async (
  userId: string,
  habits: Habit[],
  existingNotifications: InAppNotification[],
  selectedDate: Date 
): Promise<InAppNotification | null> => {
  // Only run for the current user and if the selectedDate (from component) is indeed today.
  if (!userId || getIsoDateString(selectedDate) !== getIsoDateString(new Date())) {
    return null; 
  }

  const now = new Date();
  const todayStr = getIsoDateString(now);
  const currentDayOfWeek = now.getDay(); // Sunday - 0, ..., Saturday - 6

  // Filter habits that are scheduled for today
  const habitsScheduledForToday = habits.filter(habit => {
    if (habit.frequency.type === 'daily') return true;
    if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(currentDayOfWeek);
    return false;
  });

  for (const habit of habitsScheduledForToday) {
    // Check if habit is already completed for today
    const todaysCompletionEntry = (habit.completionHistory || []).find(e => e.date === todayStr);
    const targetCompletions = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1;
    const isHabitCompletedToday = todaysCompletionEntry && todaysCompletionEntry.count >= targetCompletions;

    if (isHabitCompletedToday) continue; // Skip if already completed

    if (habit.reminderTime) {
      const [hours, minutes] = habit.reminderTime.split(':').map(Number);
      const reminderDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

      // Check if current time is past the reminder time for today
      if (now >= reminderDateTime) {
        // Check if a reminder for this specific habit on this day already exists
        const existingReminderForHabitToday = existingNotifications.find(n => 
          n.type === 'reminder' && 
          n.relatedHabitId === habit.id && 
          getIsoDateString(new Date(n.timestamp)) === todayStr
        );

        if (!existingReminderForHabitToday) {
          const newNotificationData: Omit<InAppNotification, 'id'> = {
            message: `Reminder: It's time for your habit '${habit.name}'! Don't forget to complete it today. `,
            timestamp: now.toISOString(),
            read: false,
            type: 'reminder',
            relatedHabitId: habit.id,
          };
          try {
            const notificationsCollectionRef = collection(db, 'users', userId, 'inAppNotifications');
            const docRef = await addDoc(notificationsCollectionRef, newNotificationData);
            const fullNewNotification: InAppNotification = { ...newNotificationData, id: docRef.id };
            console.log("[HabitService] Reminder notification created for habit:", habit.id, "Notification ID:", docRef.id);
            return fullNewNotification; // Return the first one created in this pass
          } catch (error) {
            console.error(`[HabitService] Error creating reminder notification for habit ${habit.name}: `, error);
            // Decide if one error should stop all reminder checks for this cycle. For now, continue.
          }
        }
      } 
    }
  }
  return null; // No new notification was created in this execution pass
};

/**
 * Fetches details for a single habit from Firestore.
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to fetch.
 * @returns A Promise resolving to the Habit object if found, or null if not found.
 * @throws Throws an error if Firestore operation fails or if parameters are missing.
 */
export const getHabitDetails = async (userId: string, habitId: string): Promise<Habit | null> => {
  if (!db || !userId || !habitId) {
    console.error("[HabitService] Missing parameters for getHabitDetails (db, userId, or habitId).");
    throw new Error("Missing parameters for fetching habit details.");
  }
  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    const docSnap = await getDoc(habitDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const createdAt = data.createdAt instanceof Timestamp 
                          ? data.createdAt.toDate().toISOString() 
                          : data.createdAt || new Date().toISOString();
      const completionHistory = (data.completionHistory || []).map((entry: any) => ({
          ...entry,
          date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : String(entry.date).split('T')[0],
      }));            
      return { id: docSnap.id, ...data, createdAt, completionHistory } as Habit;
    } else {
      console.warn("[HabitService] Habit not found with ID:", habitId, "for user:", userId);
      return null;
    }
  } catch (e) {
    console.error("[HabitService] Error in getHabitDetails:", e);
    throw e; 
  }
};

/**
 * Deletes a specific habit from Firestore.
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to delete.
 * @throws Throws an error if Firestore operation fails or if parameters are missing.
 */
export const deleteHabit = async (userId: string, habitId: string): Promise<void> => {
  if (!db || !userId || !habitId) {
    console.error("[HabitService] Missing parameters for deleteHabit (db, userId, or habitId).");
    throw new Error("Missing parameters for deleting habit.");
  }
  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    await deleteDoc(habitDocRef);
    console.log("[HabitService] Habit deleted successfully from Firestore. ID:", habitId);
  } catch (error) {
    console.error("[HabitService] Error in deleteHabit:", error);
    throw error; 
  }
};

/**
 * Updates specific fields of a habit in Firestore.
 * Allows for using `deleteField()` to remove fields from the document.
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to update.
 * @param habitDataToUpdate An object containing the fields to update. 
 *                          For fields to be removed, use `deleteField()` from `firebase/firestore`.
 * @throws Throws an error if Firestore operation fails or if parameters are missing.
 */
export const updateHabitDetails = async (
  userId: string, 
  habitId: string, 
  habitDataToUpdate: Partial<Habit> & { [key: string]: any } // Allows for deleteField sentinel
): Promise<void> => {
  if (!db || !userId || !habitId) {
    console.error("[HabitService] Missing parameters for updateHabitDetails (db, userId, or habitId).");
    throw new Error("Missing parameters for updating habit details.");
  }
  if (Object.keys(habitDataToUpdate).length === 0) {
    console.warn("[HabitService] No data provided to update habit with ID:", habitId);
    return; // No changes to make, exit early.
  }

  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    await updateDoc(habitDocRef, habitDataToUpdate);
    console.log("[HabitService] Habit details updated successfully in Firestore. ID:", habitId);
  } catch (error) {
    console.error("[HabitService] Error in updateHabitDetails:", error);
    throw error; 
  }
}; 