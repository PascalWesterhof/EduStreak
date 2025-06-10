import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Represents an item in the leaderboard, typically a user.
 */
export interface LeaderboardItem {
  id: string;          // User's unique ID
  displayName: string; // User's display name
  points: number;      // User's total points
  currentStreak: number; // User's current habit streak
  longestStreak: number; // User's longest ever habit streak
  rank?: number;       // User's rank in the leaderboard (assigned after fetching and sorting)
  photoURL?: string;   // URL to the user's profile picture (optional)
}

/**
 * Defines the metrics by which the leaderboard can be sorted.
 */
export type SortMetricType = 'points' | 'currentStreak' | 'longestStreak';

/**
 * Fetches leaderboard data (a list of users) from Firestore, sorted by the specified metric.
 * The data is limited to the top 50 users for performance and readability.
 * Rank is assigned to each user based on their position in the sorted list.
 *
 * @param sortMetric The metric to sort the leaderboard by (e.g., 'points', 'currentStreak').
 * @returns A Promise that resolves with an array of LeaderboardItem objects, ranked and sorted.
 * @throws Throws an error if fetching or processing data from Firestore fails.
 */
export const fetchLeaderboardDataFromService = async (sortMetric: SortMetricType): Promise<LeaderboardItem[]> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    // Construct the Firestore query to order by the chosen metric (descending) and limit results.
    const firestoreQuery = query(usersCollectionRef, orderBy(sortMetric, 'desc'), limit(50));

    const querySnapshot = await getDocs(firestoreQuery);
    const users: LeaderboardItem[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      users.push({
        id: doc.id,
        displayName: data.displayName || 'Anonymous', // Default to 'Anonymous' if not set
        points: data.points || 0,                    // Default to 0 if not set
        currentStreak: data.currentStreak || 0,        // Default to 0 if not set
        longestStreak: data.longestStreak || 0,        // Default to 0 if not set
        photoURL: data.photoURL,                     // Can be undefined
      });
    });

    // Assign ranks to the users after sorting has been performed by Firestore.
    const rankedUsers = users.map((user, index) => ({ ...user, rank: index + 1 }));
    return rankedUsers;

  } catch (err: any) {
    throw new Error('Failed to load leaderboard data from service. Please try again later.'); 
  }
}; 