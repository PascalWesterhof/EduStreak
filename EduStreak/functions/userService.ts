/**
 * @file userService.ts
 * @description This service manages user-specific data that is not directly tied to
 * authentication or individual habits. Its primary responsibilities include fetching
 * the user's overall streak data and performing daily checks to maintain streak integrity.
 */

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getIsoDateString } from '../utils/dateUtils';

/**
 * Represents the structure of user's streak data stored in and retrieved from Firestore.
 */
interface UserStreakData {
  currentStreak: number; // The user's current consecutive days streak for completing habits.
  longestStreak: number; // The user's longest ever consecutive days streak.
}

/**
 * Fetches the current and longest streak data for a specific user from their document
 * in the 'users' collection in Firestore.
 *
 * This function is designed to be safe. If the user document doesn't exist or if an
 * error occurs during the fetch, it returns default zero values for the streaks. This
 * prevents the application from crashing if user data is missing or inaccessible.
 *
 * @param userId The ID of the user whose streak data is to be fetched.
 * @returns A Promise that resolves to a `UserStreakData` object (`{ currentStreak, longestStreak }`).
 *          It does not re-throw errors but logs them and returns a default object.
 */
export const fetchUserStreaksFromService = async (userId: string): Promise<UserStreakData> => {
  if (!userId) {
    console.warn("[UserService] fetchUserStreaksFromService called with no userId. Returning default streak data.");
    return { currentStreak: 0, longestStreak: 0 };
  }

  try {
    // Get a direct reference to the user's document in Firestore.
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // If the document exists, retrieve its data.
      const userData = userDocSnap.data();
      // Safely access the streak data, providing a default value of 0 if the fields are missing.
      const fetchedCurrentStreak = userData.currentStreak || 0;
      const fetchedLongestStreak = userData.longestStreak || 0;
      return { currentStreak: fetchedCurrentStreak, longestStreak: fetchedLongestStreak };
    } else {
      // If the user document is not found, log it and return default values.
      console.log("[UserService] User document not found for ID:", userId, ". Returning default streak data.");
      return { currentStreak: 0, longestStreak: 0 };
    }
  } catch (error) {
    console.error("[UserService] Error fetching user streaks for ID:", userId, error);
    // Also return default values on any other error (e.g., network, permissions).
    return { currentStreak: 0, longestStreak: 0 }; 
  }
};

/**
 * Checks and potentially resets the user's daily streak. This is a crucial function
 * that should be called once per session, typically when the app is launched.
 *
 * The logic is as follows:
 * 1. It retrieves the user's `lastCompletionDate` from their Firestore document.
 * 2. It compares this date to today's date and yesterday's date.
 * 3. If the `lastCompletionDate` was neither today nor yesterday, the user has missed a day,
 *    so their `currentStreak` is reset to 0 in Firestore.
 * 4. If the user has a streak but no `lastCompletionDate`, it resets the streak to fix the data inconsistency.
 *
 * @param userId The ID of the user whose streak needs to be checked.
 * @returns A Promise that resolves when the check and any potential updates are complete.
 *          It logs errors internally but does not re-throw them, as this is a background
 *          maintenance task that should not crash the app.
 */
export const checkAndResetDailyStreak = async (userId: string): Promise<void> => {
  if (!userId) {
    console.warn("[UserService] checkAndResetDailyStreak called with no userId.");
    return;
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      const lastCompletionDate = userData.lastCompletionDate; // Expected format: 'YYYY-MM-DD'
      const currentStreak = userData.currentStreak || 0;

      if (currentStreak === 0) {
        // If there's no active streak, there's nothing to reset. We can exit early.
        return;
      }

      if (lastCompletionDate) {
        const todayStr = getIsoDateString(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getIsoDateString(yesterday);

        // This is the core logic: if the last completion was not today and not yesterday,
        // the user has missed a day, so their streak is broken.
        if (lastCompletionDate !== todayStr && lastCompletionDate !== yesterdayStr) {
          await updateDoc(userDocRef, { currentStreak: 0 });
          console.log(`[UserService] User ${userId} streak was reset to 0. Last completion: ${lastCompletionDate}.`);
        }
      } else {
        // This is a data sanitization step. If a user somehow has a streak greater than 0
        // but no `lastCompletionDate`, the data is inconsistent. We reset the streak to 0.
        await updateDoc(userDocRef, { currentStreak: 0 });
        console.log(`[UserService] User ${userId} streak reset to 0 due to missing lastCompletionDate with an active streak.`);
      }
    }
  } catch (error) {
    console.error(`[UserService] Error in checkAndResetDailyStreak for user ${userId}:`, error);
    // We don't re-throw because this is a non-critical background check.
  }
}; 