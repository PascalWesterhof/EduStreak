import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { getHabitData, calculateStats } from './statsUtils';

const StatsScreen = ({ userId, habitId }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      const habit = await getHabitData(userId, habitId);
      if (habit) {
        const stats = calculateStats(habit.completions, habit.createdAt);
        setStats(stats);
      }
    };
    fetchStats();
  }, []);

  if (!stats) return <Text>Loading...</Text>;

  return (
    <View>
      <Text>🔥 Current Streak: {stats.currentStreak} days</Text>
      <Text>✅ Completion Rate: {stats.completionRate}%</Text>
      <Text>📅 Total Days Completed: {stats.totalCompleted}</Text>
    </View>
  );
};

export default StatsScreen;
