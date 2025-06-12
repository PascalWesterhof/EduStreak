import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/firebase'; // auth removed as it's not used in this file directly yet
import { Habit } from '../types';
import { getIsoDateString } from '../utils/dateUtils';

/**
 * Fetches all habits for a given user.
 * @param userId The ID of the user whose data is to be fetched.
 * @returns A Promise resolving to an object containing habits.
 *          Returns an empty array if an error occurs or if data is not found.
 */
export const fetchUserHabits = async (userId: string): Promise<{ habits: Habit[] }> => {
  if (!db || typeof userId !== 'string') {
    console.error("[HabitService] Firestore (db) not available or userId is not a string for fetchUserHabits.");
    return { habits: [] };
  }

  try {
    const habitsCollectionRef = collection(db, 'users', userId, 'habits');
    const habitsQuery = query(habitsCollectionRef);
    const habitsSnapshot = await getDocs(habitsQuery);
    const fetchedHabits: Habit[] = habitsSnapshot.docs.map(docSn => {
      const data = docSn.data();
      return {
        id: docSn.id,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        streak: data.streak || 0,
        longestStreak: data.longestStreak || 0,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        completionHistory: (data.completionHistory || []).map((entry: any) => ({
          date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : String(entry.date).split('T')[0],
        })),
        isDefault: data.isDefault || false,
      } as Habit;
    });

    return { habits: fetchedHabits };

  } catch (error) {
    console.error("[HabitService] Error in fetchUserHabits: ", error);
    return { habits: [] };
  }
};

/**
 * Adds a new habit to Firestore for the specified user.
 * Initializes streak, longestStreak, and completionHistory for the new habit.
 * @param userId The ID of the user to add the habit for.
 * @param newHabitData An object containing the details of the new habit, excluding fields like id, streak etc.
 *                     and also excluding reminderTime and notes.
 * @returns A Promise that resolves with the fully formed Habit object (including new ID and initial values).
 * @throws Throws an error if the Firestore operation fails.
 */
export const addNewHabit = async (
  userId: string, 
  newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt' | 'reminderTime' | 'notes'>
): Promise<Habit> => {
  if (!db || !userId) {
    throw new Error("[HabitService] Firestore (db) not available or no user ID provided for addNewHabit.");
  }
  const newHabitId = uuidv4(); 
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
    const dataToSave: any = {
      name: newHabit.name,
      frequency: newHabit.frequency,
      streak: newHabit.streak,
      longestStreak: newHabit.longestStreak,
      completionHistory: newHabit.completionHistory, 
      createdAt: Timestamp.fromDate(new Date(newHabit.createdAt)),
      isDefault: newHabit.isDefault || false, 
    };
    // Add optional fields only if they exist in newHabit (description is now the only one)
    if (newHabit.description !== undefined) dataToSave.description = newHabit.description;
    // reminderTime and notes are removed

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
 * If the habit was not already completed on that date, it's marked as completed.
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to complete.
 * @param selectedDateStr The date of completion in ISO string format (YYYY-MM-DD).
 * @param currentHabitsState The current array of all habits from the component's state.
 * @returns A Promise resolving to an object indicating if the habit was newly completed on this date,
 *          and the updated habit object (or original if no change).
 * @throws Throws an error if the habit is not found or if the Firestore update fails.
 */
export const completeHabitLogic = async (
  userId: string, 
  habitId: string, 
  selectedDateStr: string, 
  currentHabitsState: Habit[] 
): Promise<{ 
  updatedHabit?: Habit, 
  wasCompletedToday: boolean 
}> => {
  let wasCompletedToday = false;
  let finalUpdatedHabit: Habit | undefined = undefined;

  const habitToUpdateIndex = currentHabitsState.findIndex(h => h.id === habitId);
  if (habitToUpdateIndex === -1) {
    console.error("[HabitService] Habit to complete not found in provided currentHabitsState for ID:", habitId);
    throw new Error("Habit not found for completion in local state.");
  }

  const originalHabit = currentHabitsState[habitToUpdateIndex];
  const newCompletionHistory = JSON.parse(JSON.stringify(originalHabit.completionHistory || []));

  const entryIndex = newCompletionHistory.findIndex((entry: { date: string }) => entry.date === selectedDateStr);

  if (entryIndex === -1) { // If not already completed on this date
    newCompletionHistory.push({ date: selectedDateStr });
    wasCompletedToday = true;
  } else {
    // Habit was already completed for this day, no change to completion status itself
    // but we still return the original habit.
    console.log(`[HabitService] Habit ${habitId} was already marked as completed for ${selectedDateStr}.`);
  }

  if (wasCompletedToday) {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    try {
      // Ensure completion history entries are plain objects for Firestore
      const firestoreCompletionHistory = newCompletionHistory.map((e: { date: string; }) => ({date: e.date}));
      await updateDoc(habitDocRef, { completionHistory: firestoreCompletionHistory });
      console.log(`[HabitService] Habit ${habitId} marked as completed for ${selectedDateStr}`);
      
      finalUpdatedHabit = { ...originalHabit, completionHistory: newCompletionHistory };

    } catch (error) {
      console.error("[HabitService] Error in completeHabitLogic (Firestore update): ", error);
      throw error; 
    }
  } else {
    finalUpdatedHabit = originalHabit; 
  }
  
  return { updatedHabit: finalUpdatedHabit, wasCompletedToday };
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

  const todaysScheduledHabits = habitsForStreakCheck.filter(h => {
    const dayOfWeek = new Date().getDay(); 
    if (h.frequency.type === 'daily') return true;
    if (h.frequency.type === 'weekly') return h.frequency.days?.includes(dayOfWeek);
    return false;
  });

  if (todaysScheduledHabits.length === 0) {
    console.log(`[HabitService] No habits scheduled for today (${todayStr}) for user ${userId}. Streak logic pertaining to today's completions/incompletions will not run. Streak continuity will depend on lastCompletionDate.`);
    return; 
  }

  for (const habit of todaysScheduledHabits) {
    const todaysEntry = (habit.completionHistory || []).find(entry => entry.date === todayStr);
    if (!todaysEntry) { // If no entry for today, it's not completed
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
          date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : String(entry.date).split('T')[0],
      }));            
      return {
         id: docSnap.id, 
         name: data.name,
         description: data.description,
         frequency: data.frequency,
         streak: data.streak || 0,
         longestStreak: data.longestStreak || 0,
         createdAt,
         completionHistory,
         isDefault: data.isDefault || false,
         // reminderTime and notes are removed
        } as Habit;
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
 * Note: `reminderTime` and `notes` are no longer part of the Habit type handled by this service.
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to update.
 * @param habitDataToUpdate An object containing the fields to update. 
 *                          For fields to be removed, use `deleteField()` from `firebase/firestore`.
 * @throws Throws an error if Firestore operation fails or if parameters are missing.
 */
export const updateHabitDetails = async (
  userId: string, 
  habitId: string, 
  // Ensure habitDataToUpdate reflects the simplified Habit type (no reminderTime, no notes)
  habitDataToUpdate: Partial<Omit<Habit, 'reminderTime' | 'notes'>> & { [key: string]: any } 
): Promise<void> => {
  if (!db || !userId || !habitId) {
    console.error("[HabitService] Missing parameters for updateHabitDetails (db, userId, or habitId).");
    throw new Error("Missing parameters for updating habit details.");
  }
  if (Object.keys(habitDataToUpdate).length === 0) {
    console.warn("[HabitService] No data provided to update habit with ID:", habitId);
    return; 
  }

  // Create a new object excluding reminderTime and notes explicitly, if they were somehow passed
  const { reminderTime, notes, ...validHabitDataToUpdate } = habitDataToUpdate as any;
  if (Object.keys(validHabitDataToUpdate).length === 0) {
    console.warn("[HabitService] No valid data provided to update habit (after excluding removed fields) with ID:", habitId);
    return; 
  }

  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    await updateDoc(habitDocRef, validHabitDataToUpdate);
    console.log("[HabitService] Habit details updated successfully in Firestore. ID:", habitId);
  } catch (error) {
    console.error("[HabitService] Error in updateHabitDetails:", error);
    throw error; 
  }
}; 