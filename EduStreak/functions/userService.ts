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
 * Fetches the current and longest streak data for a specific user from Firestore.
 *
 * @param userId The ID of the user whose streak data is to be fetched.
 *               If no userId is provided, it defaults to returning zero for both streaks.
 * @returns A Promise that resolves to a `UserStreakData` object.
 *          If the user document is not found or an error occurs, it returns
 *          `{ currentStreak: 0, longestStreak: 0 }` to ensure the application
 *          can proceed with default values.
 * @throws This function catches internal errors and logs them, returning default streak data
 *         instead of re-throwing to prevent crashes in UI components relying on this data.
 */
export const fetchUserStreaksFromService = async (userId: string): Promise<UserStreakData> => {
  if (!userId) {
    console.warn("[UserService] fetchUserStreaksFromService called with no userId. Returning default streak data.");
    return { currentStreak: 0, longestStreak: 0 };
  }

  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      // Provide default values (0) if streak fields are not present in the document.
      const fetchedCurrentStreak = userData.currentStreak || 0;
      const fetchedLongestStreak = userData.longestStreak || 0;
      return { currentStreak: fetchedCurrentStreak, longestStreak: fetchedLongestStreak };
    } else {
      console.log("[UserService] User document not found for ID:", userId, ". Returning default streak data.");
      return { currentStreak: 0, longestStreak: 0 };
    }
  } catch (error) {
    console.error("[UserService] Error fetching user streaks for ID:", userId, error);
    // Return default streak data in case of any error to prevent app crashes.
    return { currentStreak: 0, longestStreak: 0 }; 
  }
};

/**
 * Checks the user's daily streak upon app load and resets it if necessary.
 * The streak is reset to 0 if the last completion was not today or yesterday,
 * effectively breaking the chain of consecutive days.
 *
 * @param userId The ID of the user whose streak is to be checked.
 * @returns A Promise that resolves when the check and potential update are complete.
 *          This function does not throw errors for Firestore issues to prevent crashes,
 *          instead logging them.
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
      const lastCompletionDate = userData.lastCompletionDate; // Stored as 'YYYY-MM-DD'
      const currentStreak = userData.currentStreak || 0;

      if (currentStreak === 0) {
        // No active streak to reset, so we can exit.
        return;
      }

      if (lastCompletionDate) {
        const todayStr = getIsoDateString(new Date());
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = getIsoDateString(yesterday);

        // If the last completion was neither today nor yesterday, the streak is broken.
        if (lastCompletionDate !== todayStr && lastCompletionDate !== yesterdayStr) {
          await updateDoc(userDocRef, { currentStreak: 0 });
          console.log(`[UserService] User ${userId} streak was reset to 0. Last completion: ${lastCompletionDate}.`);
        }
      } else {
        // If there's a streak > 0 but no last completion date, data is inconsistent. Reset streak.
        await updateDoc(userDocRef, { currentStreak: 0 });
        console.log(`[UserService] User ${userId} streak reset to 0 due to missing lastCompletionDate with an active streak.`);
      }
    }
  } catch (error) {
    console.error(`[UserService] Error in checkAndResetDailyStreak for user ${userId}:`, error);
    // We don't re-throw, as this is a background check.
  }
}; 