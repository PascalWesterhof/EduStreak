import React from 'react';
import { View, Text } from 'react-native';

const getHabitStats = async (userId, habitId) => {
  const db = getFirestore();
  const habitDoc = await getDoc(doc(db, "users", userId, "habits", habitId));

  if (!habitDoc.exists()) return null;

  const habitData = habitDoc.data();
  const completions = habitData.completions || {};
  const dates = Object.keys(completions).sort();

  if (dates.length === 0) {
    return { total: 0, streak: 0, completionRate: 0 };
  }

  const startDate = habitData.createdAt?.toDate ? habitData.createdAt.toDate() : new Date();
  const today = new Date();
  const numberOfTotalDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24)) + 1;

  // Calculate streak (consecutive completed days up to today)
  let currentStreak = 0;
  let tempStreak = 0;

  for (let i = dates.length - 1; i >= 0; i--) {
    const date = new Date(dates[i]);
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() - (dates.length - 1 - i));

    if (date.toDateString() === expectedDate.toDateString()) {
      tempStreak++;
      if (tempStreak > currentStreak) currentStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  const completionRate = (dates.length / numberOfTotalDays) * 100;

  return {
    total: dates.length,
    streak: currentStreak,
    completionRate: completionRate.toFixed(1),
  };
};
