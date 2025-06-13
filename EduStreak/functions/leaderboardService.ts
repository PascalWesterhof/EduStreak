import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getGroupMembersWithDetails } from './groupService';

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

/**
 * Fetches leaderboard data for a specific group from Firestore.
 * It retrieves all members of the group, then sorts them on the client-side.
 * Rank is assigned after sorting.
 *
 * @param groupId The ID of the group to fetch the leaderboard for.
 * @param sortMetric The metric to sort the leaderboard by.
 * @returns A Promise that resolves with an array of LeaderboardItem objects for the group.
 * @throws Throws an error if fetching or processing data fails.
 */
export const fetchGroupLeaderboardDataFromService = async (
  groupId: string,
  sortMetric: SortMetricType
): Promise<LeaderboardItem[]> => {
  try {
    const members = await getGroupMembersWithDetails(groupId);

    if (!members) {
      return [];
    }

    // Sort the members based on the selected metric.
    const sortedMembers = [...members].sort(
      (a, b) => (b[sortMetric] || 0) - (a[sortMetric] || 0)
    );

    // Assign ranks and ensure the objects match the LeaderboardItem interface.
    const rankedUsers: LeaderboardItem[] = sortedMembers.map((user, index) => {
      return {
        id: user.id,
        displayName: user.displayName || 'Anonymous',
        points: user.points || 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        photoURL: user.photoURL,
        rank: index + 1,
      };
    });

    return rankedUsers;

  } catch (err: any) {
    console.error(`[LeaderboardService] Error fetching group leaderboard for ${groupId}:`, err);
    throw new Error('Failed to load group leaderboard data.');
  }
}; 