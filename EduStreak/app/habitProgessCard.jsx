import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { format } from 'date-fns';
import { getFirestore, collection, getDocs } from "firebase/firestore";
import StatsScreen from './statsScreen';

export default function HabitProgressCard({ userId = "test2" }) {
  const [completed, setCompleted] = useState(0);       // Number of habits completed today
  const [total, setTotal] = useState(0);               // Total number of habits
  const [habitList, setHabitList] = useState([]);      // List of habits and their statuses

  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      const habitsRef = collection(db, 'users', userId, 'habits'); // Reference to user's habits
      const snapshot = await getDocs(habitsRef);

      let totalCount = 0;
      let completedCount = 0;
      const todayStr = new Date().toISOString().split('T')[0];
      const habits = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        totalCount++; // Increment for each habit

        // Try to extract completion date and normalize it to YYYY-MM-DD format
        const completedDate = data.date?.completed?.toDate?.();
        const completedStr = completedDate?.toISOString().split('T')[0];

        // If today's date matches the habit's completed date, increment count
        if (completedStr === todayStr) {
          completedCount++;
        }

        // Add habit data to local state list for UI
        habits.push({
          id: doc.id,
          ...data,
          completedStr: completedStr || "Not completed today",
        });
      });

      setTotal(totalCount);
      setCompleted(completedCount);
      setHabitList(habits);
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
