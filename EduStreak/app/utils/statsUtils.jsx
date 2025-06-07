/*
  Calculate habit statistics based on completion records and start date.

  @param {Object} completions - Object with ISO date strings as keys (e.g., { "2025-06-01": true }).
  @param {Date|string} startDate - The date the habit was started.
  @returns {Object} An object containing totalCompleted, completionRate, and currentStreak.
 */
export const calculateStats = (completions, startDate) => {
  const today = new Date(); // Current date
  const start = new Date(startDate); // Ensure startDate is a Date object d

  // Total number of days from start to today, inclusive
  const totalDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

  // Extract all dates where the habit was marked complete
  const completedDates = Object.keys(completions || {}).sort();
  const completedSet = new Set(completedDates); // For quick lookup

  // Completion Rate
  const completionRate = (completedDates.length / totalDays) * 100;

  // Streak Calculation
  let streak = 0;
  let currentDate = new Date();

  // Count how many days in a row are in the completed set (Counts backwards)
  while (completedSet.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1); // Move to previous day
  }

  return {
    totalCompleted: completedDates.length,             // Total days completed
    completionRate: completionRate.toFixed(1),         // Percent of days completed
    currentStreak: streak                              // Consecutive days ending today
  };
};
