import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { format } from 'date-fns';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import StatsScreen from './statsScreen';
import { db } from '../firebase';
import { DrawerActions } from "@react-navigation/native";
import { useNavigation } from "expo-router";


export default function HabitProgressCard({ userId = "k8zgnVStSZTLCjGgwdwXcbjYRps2" }) {
  const [completed, setCompleted] = useState(0);       // Number of habits completed today
  const [total, setTotal] = useState(0);               // Total number of habits
  const [habitList, setHabitList] = useState([]);      // List of habits and their statuses

  useEffect(() => {
  const fetchData = async () => {
    try {
      const habitsRef = collection(db, 'users', userId, 'habits');
      const snapshot = await getDocs(habitsRef);

      const todayStr = new Date().toISOString().split('T')[0];
      let totalCount = 0;
      let completedCount = 0;
      const habits = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        const { name, frequency, streak, longestStreak, completionHistory = [] } = data;

        // Count total and completed
        totalCount++;
        const completedToday = completionHistory.some(entry => {
          const entryDate = entry?.toDate?.().toISOString?.().split('T')[0];
          return entryDate === todayStr;
        });
        if (completedToday) completedCount++;

        habits.push({
          id: doc.id,
          name,
          frequency,
          streak,
          longestStreak,
          completedToday,
          totalCompletions: completionHistory.length,
        });
      });

      setTotal(totalCount);
      setCompleted(completedCount);
      setHabitList(habits);
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  fetchData();
}, [userId]);

  // Calculate completion percentage for the circular progress
  const fill = total > 0 ? (completed / total) * 100 : 0;

  return (
    <View style={styles.card}>
      {/* Optionally show stats for a specific habit (e.g., "study") */}
      <SafeAreaView style={{ flex: 1 }}>
        <StatsScreen userId={userId} habitId="study" />
      </SafeAreaView>

      {/* Display today's date */}
      <Text style={styles.date}>{format(new Date(), 'MMM dd, yyyy')}</Text>

      {/* Display total habits completed today */}
      <Text style={styles.title}>{`${completed}/${total} habits completed`}</Text>

      {/* Circular progress showing percent completion */}
      <AnimatedCircularProgress
        size={120}
        width={15}
        fill={fill}
        tintColor="#B4685F"
        backgroundColor="#f2f2f2"
        rotation={0}
        lineCap="round"
      >
        {() => <Text style={styles.percentage}>{`${Math.round(fill)}%`}</Text>}
      </AnimatedCircularProgress>

      {/* Display each habit and its completion status */}
      <View style={styles.habitList}>
        {habitList.map(habit => (
          <Text key={habit.id} style={styles.habitItem}>
            • {habit.name || habit.id} — {habit.completedStr}
          </Text>
        ))}
      </View>
    </View>
  );
}

// Styles for visual layout
const styles = StyleSheet.create({
  card: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    margin: 10,
  },
  title: {
    fontSize: 16,
    marginVertical: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  date: {
    fontSize: 14,
    marginBottom: 6,
    color: '#888',
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B4685F',
  },
  habitList: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  habitItem: {
    fontSize: 14,
    color: '#444',
    marginBottom: 4,
  },
});