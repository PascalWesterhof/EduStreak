import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { deleteDoc, doc, getDoc, Timestamp } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../config/firebase'; // Corrected path
import { Habit } from '../../types'; // Corrected path

export default function HabitDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const habitId = params.id as string;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setHabit(null); 
        setIsLoading(false); 
        setError("User not authenticated. Please sign in.");
      }
    });
    return () => unsubscribe();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (!currentUserId || !habitId) {
        console.log("HabitDetailScreen focused, but no user ID or habit ID. Clearing habit details.");
        setHabit(null);
        setIsLoading(false);
        if (!currentUserId) setError("User not authenticated. Please sign in.");
        if (!habitId) setError("Habit ID not provided.");
        return;
      }

      console.log(`HabitDetailScreen focused for user: ${currentUserId}, habit: ${habitId}. Fetching habit details.`);
      const fetchHabitDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const habitDocRef = doc(db, 'users', currentUserId, 'habits', habitId);
          const docSnap = await getDoc(habitDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const createdAt = data.createdAt instanceof Timestamp 
                                ? data.createdAt.toDate().toISOString() 
                                : data.createdAt || new Date().toISOString();
            const completionHistory = (data.completionHistory || []).map((entry: any) => ({
                ...entry,
                date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : entry.date,
            }));            
            setHabit({ id: docSnap.id, ...data, createdAt, completionHistory } as Habit);
            console.log("Habit details fetched successfully for HabitDetailScreen:", habitId);
          } else {
            setError('Habit not found.');
            setHabit(null);
            console.log("No such document for habit:", habitId);
          }
        } catch (e) {
          console.error("Error fetching habit details for HabitDetailScreen: ", e);
          setError('Failed to load habit details. Please try again.');
        } finally {
          setIsLoading(false);
        }
      };

      fetchHabitDetails();
      
      // Optional: Return a cleanup function if fetchHabitDetails sets up any subscriptions
      // return () => { /* cleanup */ };
    }, [currentUserId, habitId]) // Dependencies: re-run if currentUserId or habitId changes
  );

  const handleDeleteHabit = async () => {
    if (!currentUserId || !habitId) {
      Alert.alert("Error", "Cannot delete habit: missing user or habit ID.");
      return;
    }
    console.log(`Attempting and proceeding to delete habit: ${habitId} for user: ${currentUserId}`);

    try {
      const habitDocRef = doc(db, 'users', currentUserId, 'habits', habitId);
      await deleteDoc(habitDocRef);
      console.log(`Habit ${habitId} successfully deleted from Firestore for user ${currentUserId}.`);
      router.back(); // Navigate back immediately
      Alert.alert("Success", `Habit "${habit?.name || 'The habit'}" deleted successfully.`, [
        { text: "OK" } // OK button now just dismisses the alert
      ]);
    } catch (error) {
      console.error("Error deleting habit: ", error);
      Alert.alert("Error", `Failed to delete habit "${habit?.name || habitId}". Please try again.`);
    }
  };
  
  const handleEditHabit = () => {
    if (!habit) return;
    // We will create app/edit-habit.tsx screen later
    // For now, this will likely cause a 404 if the route doesn't exist or isn't fully typed in router.
    router.push({ pathname: '/edit-habit' as any, params: { habitId: habitId } }); 
    console.log("Attempting to navigate to edit habit: ", habitId);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#D05B52" /><Text>Loading habit...</Text></View>;
  }

  if (error) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text><Button title="Go Back" onPress={() => router.back()} /></View>;
  }

  if (!habit) {
    return <View style={styles.centered}><Text>Habit not found or not loaded.</Text><Button title="Go Back" onPress={() => router.back()} /></View>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>{habit.name}</Text>
      <Text style={styles.detailText}>Description: {habit.description || 'N/A'}</Text>
      <Text style={styles.detailText}>
        Frequency: {habit.frequency.type === 'daily'
          ? `${habit.frequency.times} time(s) a day`
          : `${habit.frequency.times} time(s) a week on ${habit.frequency.days?.map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}`}
      </Text>
      <Text style={styles.detailText}>Streak: {habit.streak} (Longest: {habit.longestStreak})</Text>
      <Text style={styles.detailText}>Notes: {habit.notes || 'N/A'}</Text>
      <Text style={styles.detailText}>Created At: {new Date(habit.createdAt).toLocaleDateString()}</Text>
      
      <Text style={styles.historyTitle}>Completion History:</Text>
      {habit.completionHistory && habit.completionHistory.length > 0 ? (
        habit.completionHistory.map((entry, index) => (
          <Text key={index} style={styles.historyEntry}>
            {new Date(entry.date).toLocaleDateString()}: {entry.completed ? 'Completed' : 'Not Completed'}
          </Text>
        ))
      ) : (
        <Text style={styles.detailText}>No completion history yet.</Text>
      )}

      <View style={styles.buttonContainer}>
        <Button title="Edit Habit" onPress={handleEditHabit} />
        <Button title="Delete Habit" onPress={handleDeleteHabit} color="red" />
      </View>
      <Button title="Back to Habits" onPress={() => router.back()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  detailText: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
    lineHeight: 22,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: '#444',
  },
  historyEntry: {
    fontSize: 14,
    marginBottom: 5,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
    marginBottom: 15,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 25,
    marginBottom: 15,
  },
}); 