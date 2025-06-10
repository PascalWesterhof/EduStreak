import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { db } from '../config/firebase';
import { calculateStats } from './utils/statsUtils';

export default function StatsScreen({ userId, habitId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [computedStats, setComputedStats] = useState(null);

  useEffect(() => {
    if (!userId || !habitId) return;

    const fetchStats = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'users', userId, 'habits', habitId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setStats(data);

          const startDate = data?.createdAt?.toDate?.();
          const completions = data?.completionHistory || [];

          if (startDate && Array.isArray(completions)) {
            const computed = calculateStats(completions, startDate);
            setComputedStats(computed);
          }
        } else {
          setStats(null);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, habitId]);

  if (loading) return <Text style={styles.loading}>Loading stats...</Text>;
  if (!stats) return <Text style={styles.error}>No stats found for this habit.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Habit: {stats.name || habitId}</Text>
      {computedStats && (
        <View style={styles.statsBox}>
          <Text>Total Completed: {computedStats.totalCompleted}</Text>
          <Text>Completion Rate: {computedStats.completionRate}%</Text>
          <Text>Current Streak: {computedStats.currentStreak} days</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    alignItems: 'center',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsBox: {
    alignItems: 'center',
  },
  loading: {
    textAlign: 'center',
    color: '#888',
  },
  error: {
    textAlign: 'center',
    color: 'red',
  },
});
