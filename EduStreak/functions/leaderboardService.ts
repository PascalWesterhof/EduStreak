/**
 * @file leaderboardService.ts
 * @description This service provides functions to fetch and rank user data for leaderboards.
 * It supports both a global leaderboard (ranking all users) and group-specific leaderboards.
 * The service is responsible for querying Firestore, sorting the user data based on specific
 * metrics, and assigning ranks before returning the data to the UI components.
 */

import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getGroupMembersWithDetails } from './groupService';

/**
 * Represents a single entry (a user) in a leaderboard.
 * This interface standardizes the structure of user data presented in the UI.
 */
export interface LeaderboardItem {
  id: string;          // The user's unique ID from Firebase Auth.
  displayName: string; // The user's display name.
  points: number;      // The user's total accumulated points.
  currentStreak: number; // The user's current daily completion streak.
  longestStreak: number; // The user's longest-ever daily completion streak.
  rank?: number;       // The user's rank in the current leaderboard view (e.g., 1, 2, 3). This is assigned by the service.
  photoURL?: string;   // An optional URL to the user's profile picture.
}

/**
 * Defines the valid metrics that can be used for sorting the leaderboards.
 * Using a TypeScript `type` ensures that only these specific string values can be used,
 * preventing typos and making the code more robust.
 */
export type SortMetricType = 'points' | 'currentStreak' | 'longestStreak';

/**
 * Fetches leaderboard data for all users (a global leaderboard) from Firestore.
 * 
 * The process is as follows:
 * 1. It constructs a Firestore query on the 'users' collection.
 * 2. The query orders users by the specified `sortMetric` in descending order (highest first).
 * 3. It limits the results to the top 50 users to ensure good performance and a manageable list size.
 * 4. After fetching, it maps over the results and assigns a rank to each user based on their position.
 *
 * @param sortMetric The metric to sort the leaderboard by (e.g., 'points', 'currentStreak').
 * @returns A Promise that resolves with an array of `LeaderboardItem` objects, ranked and sorted.
 * @throws Throws a custom error if fetching or processing data from Firestore fails.
 */
export const fetchLeaderboardDataFromService = async (sortMetric: SortMetricType): Promise<LeaderboardItem[]> => {
  try {
    const usersCollectionRef = collection(db, 'users');
    // Construct the Firestore query. This is where the sorting and limiting happens on the database side.
    const firestoreQuery = query(usersCollectionRef, orderBy(sortMetric, 'desc'), limit(50));

    // Execute the query to get a snapshot of the results.
    const querySnapshot = await getDocs(firestoreQuery);
    const users: LeaderboardItem[] = [];
    // Iterate over each document in the snapshot.
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      // Push a formatted object into the users array, providing default values for any missing fields.
      users.push({
        id: doc.id,
        displayName: data.displayName || 'Anonymous', // Default to 'Anonymous' if name is not set.
        points: data.points || 0,                    // Default to 0 if not set.
        currentStreak: data.currentStreak || 0,        // Default to 0 if not set.
        longestStreak: data.longestStreak || 0,        // Default to 0 if not set.
        photoURL: data.photoURL,                     // This can be undefined if not set.
      });
    });

    // After fetching and formatting, assign a rank to each user based on their order in the array.
    const rankedUsers = users.map((user, index) => ({ ...user, rank: index + 1 }));
    return rankedUsers;

  } catch (err: any) {
    // If anything in the `try` block fails, catch the error and throw a new, more user-friendly error.
    throw new Error('Failed to load leaderboard data from service. Please try again later.'); 
  }
};

/**
 * Fetches leaderboard data for a specific group.
 *
 * Unlike the global leaderboard, this function works differently:
 * 1. It first calls the `groupService` to get a list of all members in the specified group.
 * 2. It then sorts this list of members on the client-side (in the function itself) based on the `sortMetric`.
 * 3. Finally, it assigns ranks to the sorted members.
 * This approach is used because Firestore doesn't support efficiently querying a collection (`users`)
 * based on a list of IDs from another document (`group.members`).
 *
 * @param groupId The ID of the group to fetch the leaderboard for.
 * @param sortMetric The metric to sort the leaderboard by.
 * @returns A Promise that resolves with an array of `LeaderboardItem` objects for the specified group.
 * @throws Throws an error if fetching or processing data fails.
 */
export const fetchGroupLeaderboardDataFromService = async (
  groupId: string,
  sortMetric: SortMetricType
): Promise<LeaderboardItem[]> => {
  try {
    // Step 1: Get all members of the group, with their full user details.
    const members = await getGroupMembersWithDetails(groupId);

    if (!members) {
      // If the group has no members or doesn't exist, return an empty array.
      return [];
    }

    // Step 2: Sort the fetched members here on the client-side.
    // The `sort` method mutates the array, so we create a shallow copy `[...members]` first.
    const sortedMembers = [...members].sort(
      (a, b) => (b[sortMetric] || 0) - (a[sortMetric] || 0)
    );

    // Step 3: Assign ranks and ensure the objects match the LeaderboardItem interface.
    // This mapping ensures that even if the `members` objects have extra fields, the final
    // result is clean and conforms to the `LeaderboardItem` structure.
    const rankedUsers: LeaderboardItem[] = sortedMembers.map((user, index) => {
      return {
        id: user.id,
        displayName: user.displayName || 'Anonymous',
        points: user.points || 0,
        currentStreak: user.currentStreak || 0,
        longestStreak: user.longestStreak || 0,
        photoURL: user.photoURL,
        rank: index + 1, // Assign rank based on the sorted position.
      };
    });

    return rankedUsers;

  } catch (err: any) {
    console.error(`[LeaderboardService] Error fetching group leaderboard for ${groupId}:`, err);
    throw new Error('Failed to load group leaderboard data.');
  }
}; 