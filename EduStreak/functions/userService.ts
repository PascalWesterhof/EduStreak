import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

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