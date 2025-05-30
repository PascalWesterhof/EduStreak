export const calculateStats = (completions, startDate) => {
  const today = new Date();
  const start = new Date(startDate);
  const totalDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

  const completedDates = Object.keys(completions || {}).sort();
  const completedSet = new Set(completedDates);

  // Completion rate
  const completionRate = (completedDates.length / totalDays) * 100;

  // Streak
  let streak = 0;
  let currentDate = new Date();
  while (completedSet.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return {
    totalCompleted: completedDates.length,
    completionRate: completionRate.toFixed(1),
    currentStreak: streak
  };
};
