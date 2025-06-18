/**
 * @file habitService.ts
 * @description This service is the central hub for all business logic related to habits.
 * It handles creating, reading, updating, and deleting (CRUD) habits in Firestore.
 * It also contains critical logic for calculating user streaks based on habit completions.
 * This service acts as the sole intermediary between the UI components and the habit data
 * in the Firestore database, ensuring a clean separation of concerns.
 */

import { collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // auth removed as it's not used in this file directly yet
import { Habit } from '../types';
import { getIsoDateString } from '../utils/dateUtils';
const { v4: uuidv4 } = require('uuid');

/**
 * Recalculates the current and longest streaks for a single habit based on its completion history.
 * This is a "pure function," meaning it doesn't have side effects (like calling a database)
 * and will always return the same output for the same input. It's designed to be a reliable,
 * reusable utility for streak calculation.
 * 
 * The logic is as follows:
 * 1. It sorts the completion dates from most recent to oldest.
 * 2. It determines the "current streak" by checking if the habit was completed today or yesterday.
 *    If so, it walks backwards day-by-day to count consecutive completions.
 * 3. It separately calculates the "longest streak" by iterating through the entire history
 *    to find the longest sequence of consecutive days, regardless of when it happened.
 * 
 * @param habit The habit object, which must include its `completionHistory` array.
 * @returns An object containing the recalculated `streak` (current) and `longestStreak`.
 */
export const recalculateHabitStreaks = (habit: Habit): { streak: number, longestStreak: number } => {
    if (!habit.completionHistory || habit.completionHistory.length === 0) {
        return { streak: 0, longestStreak: 0 };
    }

    // Sort dates in descending order (most recent first) to make streak calculation easier.
    const sortedDates = habit.completionHistory
        .map(entry => entry.date)
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    
    // First, calculate the *current* streak.
    if (sortedDates.length > 0) {
        const today = new Date();
        const todayStr = getIsoDateString(today);
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const yesterdayStr = getIsoDateString(yesterday);

        // A "current" streak can only exist if the most recent completion was today or yesterday.
        if (sortedDates[0] === todayStr || sortedDates[0] === yesterdayStr) {
            currentStreak = 1;
            longestStreak = 1;
            
            // Walk backwards through the sorted dates.
            for (let i = 0; i < sortedDates.length - 1; i++) {
                const currentDate = new Date(sortedDates[i]);
                const nextDate = new Date(sortedDates[i+1]);
                // Calculate the difference in days between this completion and the one before it.
                const diff = (currentDate.getTime() - nextDate.getTime()) / (1000 * 3600 * 24);

                if (diff === 1) {
                    // If the difference is exactly one day, they are consecutive, so increment the streak.
                    currentStreak++;
                } else {
                    // If the difference is more than one day, the current streak is broken.
                    // We stop counting the current streak here.
                    break; 
                }
            }
        }
    }
    
    // Now, independently find the *longest* streak ever recorded in the history.
    // This is necessary because the current streak might not be the longest one.
    let tempCurrentStreak = 0;
    let tempLongestStreak = 0;
    if (sortedDates.length > 0) {
        tempCurrentStreak = 1;
        tempLongestStreak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
            const currentDate = new Date(sortedDates[i]);
            const nextDate = new Date(sortedDates[i+1]);
            const diff = (currentDate.getTime() - nextDate.getTime()) / (1000 * 3600 * 24);
            if (diff === 1) {
                // It's a consecutive day, increment the temporary counter.
                tempCurrentStreak++;
            } else {
                // The streak is broken, reset the temporary counter.
                tempCurrentStreak = 1; 
            }
            // After each check, see if the streak we just calculated is the new longest.
            if (tempCurrentStreak > tempLongestStreak) {
                tempLongestStreak = tempCurrentStreak;
            }
        }
    }

    // Return the calculated current streak and the absolute longest streak found.
    return { streak: currentStreak, longestStreak: tempLongestStreak };
};

/**
 * Fetches all habits for a given user from their subcollection in Firestore.
 * It also transforms the data from Firestore's format (e.g., Timestamps)
 * into the application's expected `Habit` type format (e.g., ISO date strings).
 * 
 * @param userId The ID of the user whose habits are to be fetched.
 * @returns A Promise that resolves to an object containing an array of `Habit` objects.
 *          Returns an empty array `{ habits: [] }` if an error occurs or no habits are found,
 *          ensuring the app doesn't crash.
 */
export const fetchUserHabits = async (userId: string): Promise<{ habits: Habit[] }> => {
  if (!db || typeof userId !== 'string') {
    console.error("[HabitService] Firestore (db) not available or userId is not a string for fetchUserHabits.");
    return { habits: [] };
  }

  try {
    // Get a reference to the 'habits' subcollection for the specific user.
    const habitsCollectionRef = collection(db, 'users', userId, 'habits');
    const habitsQuery = query(habitsCollectionRef);
    const habitsSnapshot = await getDocs(habitsQuery);
    
    // Map over the documents returned from Firestore.
    const fetchedHabits: Habit[] = habitsSnapshot.docs.map(docSn => {
      const data = docSn.data();
      // Transform the raw Firestore data into the structured `Habit` type.
      return {
        id: docSn.id,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        streak: data.streak || 0,
        longestStreak: data.longestStreak || 0,
        // Firestore Timestamps are converted to ISO strings for consistency in the app.
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
        // Ensure completion history dates are also consistently formatted as 'YYYY-MM-DD'.
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
 * Adds a new habit to Firestore for a specified user.
 * It generates a unique ID for the new habit and initializes its values
 * (e.g., streak, creation date) before saving it to the database.
 * 
 * @param userId The ID of the user to add the habit for.
 * @param newHabitData An object containing the core details of the new habit (name, frequency, etc.).
 *                     It intentionally omits fields that should be initialized by the service (like id, streak).
 * @returns A Promise that resolves with the fully formed `Habit` object, including the newly generated ID.
 * @throws Throws an error if the Firestore `setDoc` operation fails.
 */
export const addNewHabit = async (
  userId: string, 
  newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt' | 'reminderTime' | 'notes'>
): Promise<Habit> => {
  if (!db || !userId) {
    throw new Error("[HabitService] Firestore (db) not available or no user ID provided for addNewHabit.");
  }
  // Generate a new universally unique identifier (UUID) for the habit ID.
  const newHabitId = uuidv4(); 
  // Construct the full habit object with initial default values.
  const newHabit: Habit = {
    ...newHabitData,
    id: newHabitId, 
    streak: 0,
    longestStreak: 0,
    completionHistory: [],
    createdAt: new Date().toISOString(),
  };

  try {
    // Get a reference to the document path for the new habit.
    const habitDocRef = doc(db, 'users', userId, 'habits', newHabitId);
    // Prepare the data for saving, converting the `createdAt` date into a Firestore Timestamp.
    const dataToSave: any = {
      name: newHabit.name,
      frequency: newHabit.frequency,
      streak: newHabit.streak,
      longestStreak: newHabit.longestStreak,
      completionHistory: newHabit.completionHistory, 
      createdAt: Timestamp.fromDate(new Date(newHabit.createdAt)),
      isDefault: newHabit.isDefault || false, 
    };
    // To keep our Firestore documents clean, only add optional fields if they have a value.
    if (newHabit.description !== undefined) dataToSave.description = newHabit.description;
    
    // Save the new habit document to Firestore.
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
 * 
 * This function checks if the habit has already been completed on the given date.
 * If not, it adds the date to the habit's `completionHistory` array in Firestore.
 * This function is designed to be idempotent: calling it multiple times for the same
 * habit on the same day will only result in one completion entry.
 * 
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit being completed.
 * @param selectedDateStr The date of completion, formatted as an ISO string ('YYYY-MM-DD').
 * @param currentHabitsState The complete, up-to-date array of all habits from the component's state.
 *                           This is used for an immediate local check to avoid unnecessary Firestore reads.
 * @returns A Promise that resolves to an object containing:
 *          - `updatedHabit`: The modified habit object to allow for immediate UI updates.
 *          - `wasCompletedToday`: A boolean indicating if the habit was newly marked as complete.
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

  // Find the habit in the local state array provided by the component.
  const habitToUpdateIndex = currentHabitsState.findIndex(h => h.id === habitId);
  if (habitToUpdateIndex === -1) {
    console.error("[HabitService] Habit to complete not found in provided currentHabitsState for ID:", habitId);
    throw new Error("Habit not found for completion in local state.");
  }

  const originalHabit = currentHabitsState[habitToUpdateIndex];
  // Create a deep copy of the completion history to avoid directly mutating the state.
  const newCompletionHistory = JSON.parse(JSON.stringify(originalHabit.completionHistory || []));

  // Check if an entry for the selected date already exists.
  const entryIndex = newCompletionHistory.findIndex((entry: { date: string }) => entry.date === selectedDateStr);

  if (entryIndex === -1) { // If it's a new completion for this date...
    newCompletionHistory.push({ date: selectedDateStr });
    wasCompletedToday = true;
  } else {
    // If it was already completed, do nothing.
    console.log(`[HabitService] Habit ${habitId} was already marked as completed for ${selectedDateStr}.`);
  }

  // Only perform a database write if the completion status actually changed.
  if (wasCompletedToday) {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    try {
      // Ensure completion history entries are plain objects before sending to Firestore.
      const firestoreCompletionHistory = newCompletionHistory.map((e: { date: string; }) => ({date: e.date}));
      // Update the document in Firestore with the new completion history.
      await updateDoc(habitDocRef, { completionHistory: firestoreCompletionHistory });
      console.log(`[HabitService] Habit ${habitId} marked as completed for ${selectedDateStr}`);
      
      // Prepare the updated habit object to be returned for immediate state update in the UI.
      finalUpdatedHabit = { ...originalHabit, completionHistory: newCompletionHistory };

    } catch (error) {
      console.error("[HabitService] Error in completeHabitLogic (Firestore update): ", error);
      throw error; 
    }
  } else {
    // If no change was made, just return the original habit.
    finalUpdatedHabit = originalHabit; 
  }
  
  return { updatedHabit: finalUpdatedHabit, wasCompletedToday };
};

/**
 * Checks all of a user's habits to see if their overall daily streak should be updated.
 * This is a critical piece of the app's core loop. It's typically called after any habit is completed.
 * 
 * The logic is:
 * 1. Filter to get only the habits that were scheduled for today.
 * 2. Check if *all* of those scheduled habits have a completion entry for today.
 * 3. If they do, update the user's main streak (`currentStreak`, `longestStreak`) in their top-level user document.
 * 
 * @param userId The ID of the current user.
 * @param habitsForStreakCheck An array of all the user's habits, used to determine which are scheduled for today.
 */
export const updateDailyStreakLogic = async (userId: string, habitsForStreakCheck: Habit[]): Promise<void> => {
  if (!userId) {
    console.warn("[HabitService] No userId provided for updateDailyStreakLogic.");
    return;
  }

  const todayStr = getIsoDateString(new Date());
  let allTodaysHabitsCompleted = true;

  // Step 1: Filter habits to find only those scheduled for today.
  const todaysScheduledHabits = habitsForStreakCheck.filter(h => {
    const dayOfWeek = new Date().getDay(); // 0 (Sun) to 6 (Sat)
    if (h.frequency.type === 'daily') return true;
    if (h.frequency.type === 'weekly') return h.frequency.days?.includes(dayOfWeek);
    return false;
  });

  // If there are no habits scheduled for today, we can't complete the day, so we exit.
  if (todaysScheduledHabits.length === 0) {
    console.log(`[HabitService] No habits scheduled for today (${todayStr}) for user ${userId}. Streak logic pertaining to today's completions/incompletions will not run. Streak continuity will depend on lastCompletionDate.`);
    return; 
  }

  // Step 2: Loop through today's scheduled habits to see if they're all done.
  for (const habit of todaysScheduledHabits) {
    const todaysEntry = (habit.completionHistory || []).find(entry => entry.date === todayStr);
    if (!todaysEntry) { // If even one habit is missing a completion entry for today...
      allTodaysHabitsCompleted = false; // ...then the day is not complete.
      break;
    }
  }

  // Step 3: If all of today's habits are complete, update the user's streak.
  if (allTodaysHabitsCompleted) {
    const userDocRef = doc(db, "users", userId);
    try {
      const userDocSnap = await getDoc(userDocRef);
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        let newCurrentStreak = userData.currentStreak || 0;
        let newLongestStreak = userData.longestStreak || 0;
        const lastCompletionDate = userData.lastCompletionDate; // Stored as 'YYYY-MM-DD'

        // Only update the streak if we haven't already updated it for today.
        if (lastCompletionDate !== todayStr) { 
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = getIsoDateString(yesterday);

          if (lastCompletionDate === yesterdayStr) {
            // If the last completion was yesterday, it's a consecutive day, so increment the streak.
            newCurrentStreak += 1;
          } else {
            // If the last completion was not yesterday, the streak was broken, so it resets to 1 (for today).
            newCurrentStreak = 1; 
          }
          // If the new current streak is greater than the longest ever, update the longest streak.
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }
          // Write the new streak values and today's date to Firestore.
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
      // We don't re-throw here because this is a background-like update.
      // We don't want a failed streak update to crash the user's app.
    }
  }
};

/**
 * Fetches the complete details for a single habit from Firestore.
 * After fetching, it runs the `recalculateHabitStreaks` function to ensure the
 * streak data is fresh and accurate, and optionally updates Firestore if the
 * stored values were out of sync.
 * 
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to fetch.
 * @returns A Promise that resolves to the `Habit` object if found, or `null` if not.
 * @throws Throws an error if the Firestore operation fails.
 */
export const getHabitDetails = async (userId: string, habitId: string): Promise<Habit | null> => {
  if (!db || !userId || !habitId) {
    console.error("[HabitService] Missing parameters for getHabitDetails (db, userId, or habitId).");
    throw new Error("Missing parameters for fetching habit details.");
  }
  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    const habitDocSnap = await getDoc(habitDocRef);

    if (habitDocSnap.exists()) {
      const data = habitDocSnap.data();
      // Transform Firestore data to the app's Habit type.
      const habit: Habit = {
        id: habitDocSnap.id,
        name: data.name,
        description: data.description,
        frequency: data.frequency,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        completionHistory: (data.completionHistory || []).map((entry: any) => ({
          date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : String(entry.date).split('T')[0],
        })),
        isDefault: data.isDefault || false,
        streak: 0, // Initialize with 0, will be recalculated next.
        longestStreak: 0, // Initialize with 0, will be recalculated next.
      };
      
      // Recalculate streaks based on the fresh completion history.
      const { streak, longestStreak } = recalculateHabitStreaks(habit);
      habit.streak = streak;
      habit.longestStreak = longestStreak;

      // This is a self-healing mechanism. If the calculated streaks differ from what was
      // stored in Firestore, update the Firestore document to correct it.
      if (streak !== data.streak || longestStreak !== data.longestStreak) {
        await updateDoc(habitDocRef, {
          streak: streak,
          longestStreak: longestStreak
        });
      }

      return habit;
    } else {
      console.log(`[HabitService] No habit found with ID: ${habitId} for user: ${userId}`);
      return null;
    }
  } catch (error) {
    console.error("[HabitService] Error in getHabitDetails: ", error);
    throw error;
  }
};

/**
 * Deletes a specific habit from Firestore. This is a simple, direct deletion.
 * 
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to delete.
 * @throws Throws an error if the Firestore `deleteDoc` operation fails.
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
 * Updates specific fields of a habit document in Firestore.
 * This function performs a partial update, only changing the fields provided in the
 * `habitDataToUpdate` object.
 * 
 * @param userId The ID of the current user.
 * @param habitId The ID of the habit to update.
 * @param habitDataToUpdate An object containing only the fields and values to be updated.
 *                          e.g., `{ name: 'New Habit Name', description: 'New description' }`
 * @throws Throws an error if the Firestore `updateDoc` operation fails.
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

  // Sanitize the input to ensure deprecated fields like `reminderTime` are not sent to Firestore.
  const { reminderTime, notes, ...validHabitDataToUpdate } = habitDataToUpdate as any;
  if (Object.keys(validHabitDataToUpdate).length === 0) {
    console.warn("[HabitService] No valid data provided to update habit (after excluding removed fields) with ID:", habitId);
    return; 
  }

  try {
    const habitDocRef = doc(db, 'users', userId, 'habits', habitId);
    // Perform the partial update on the document.
    await updateDoc(habitDocRef, validHabitDataToUpdate);
    console.log("[HabitService] Habit details updated successfully in Firestore. ID:", habitId);
  } catch (error) {
    console.error("[HabitService] Error in updateHabitDetails:", error);
    throw error; 
  }
}; 