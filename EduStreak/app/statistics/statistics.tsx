import { doc, getDoc } from 'firebase/firestore';
/*
  Calculate habit statistics including total completions, current streak, and completion rate.
  @param {string} userId - The user's ID.
  @param {string} habitId - The habit's ID.
  @returns {Promise<Object|null>} Habit stats or null if habit doesn't exist.d
 */
const getHabitStats = async (userId, habitId) => {
  const db = getFirestore(); // Get Firestore instance
  const habitDoc = await getDoc(doc(db, "users", userId, "habits", habitId)); // Fetch habit document

  if (!habitDoc.exists()) return null; // Return null if habit doesn't exist

  const habitData = habitDoc.data();
  const completions = habitData.completions || {}; // Object with dates as keys
  const dates = Object.keys(completions).sort(); // Sorted list of completion dates

  if (dates.length === 0) {
    return { total: 0, streak: 0, completionRate: 0 };
  }

  // Determine when the habit was created
  const startDate = habitData.createdAt?.toDate ? habitData.createdAt.toDate() : new Date();
  const today = new Date();

  // Calculate the number of days since the habit was created
  const numberOfTotalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // --- Calculate Streak ---
  // We'll check how many days in a row (ending today) have been completed
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = dates.length - 1; i >= 0; i--) {
    const date = new Date(dates[i]); // Actual completion date
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - (dates.length - 1 - i)); // Expected consecutive date

    // If dates match, continue the streak
    if (date.toDateString() === expectedDate.toDateString()) {
      tempStreak++;
      if (tempStreak > currentStreak) currentStreak = tempStreak;
    } else {
      // Streak broken
      tempStreak = 0;
    }
  }

  // Calculate completion rate as a percentage of completed days over total possible days
  const completionRate = (dates.length / numberOfTotalDays) * 100;

  return {
    total: dates.length,                  // Total number of days completed
    streak: currentStreak,                // Longest streak of consecutive completions
    completionRate: completionRate.toFixed(1), // Rounded completion percentage
  };
};
