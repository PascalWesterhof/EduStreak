import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';  // Adjust path if needed

export default function StatsScreen({ userId, habitId }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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
        } else {
          setStats(null); // no data found
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [userId, habitId]);

  if (loading) return <Text>Loading...</Text>;
  if (!stats) return <Text>No stats found for this habit.</Text>;

  return (
    <View>
      <Text>Stats: {JSON.stringify(stats)}</Text>
    </View>
  );
}
