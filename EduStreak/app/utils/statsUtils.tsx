export const calculateStats = (completions, startDate) => {
  const today = new Date();
  const start = new Date(startDate);
  const totalDays = Math.floor((today - start) / (1000 * 60 * 60 * 24)) + 1;

  // Normalize completions into an array of ISO date strings
  const completedDates = Array.isArray(completions)
    ? completions.map(date => new Date(date).toISOString().split('T')[0])
    : Object.keys(completions || {});

  const completedSet = new Set(completedDates);

  // Completion Rate
  const completionRate = (completedDates.length / totalDays) * 100;

  // Current Streak Calculation
  let streak = 0;
  let currentDate = new Date();

  while (completedSet.has(currentDate.toISOString().split('T')[0])) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return {
    totalCompleted: completedDates.length,
    completionRate: completionRate.toFixed(1),
    currentStreak: streak,
  };
};
