import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import onAuthStateChanged and User type
import { collection, doc, getDocs, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore'; // Firestore functions
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Button, FlatList, Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values'; // For uuid
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../../config/firebase'; // Import db and auth
import { Habit } from '../../types'; // Adjusted path
import AddHabitScreen from '../AddHabitScreen'; // Adjusted path


export default function Index() {
  const appNavigation = useNavigation();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For loading indicator
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Initialize to null

  // Listen for auth state changes
  useEffect(() => {
    setIsLoading(true); // Start loading when checking auth state
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        console.log("User is signed in with ID: ", user.uid);
        setCurrentUserId(user.uid);
      } else {
        console.log("User is signed out.");
        setCurrentUserId(null);
        setHabits([]); // Clear habits if user signs out
        setIsLoading(false); // Stop loading if no user
      }
      // Note: setIsLoading(false) for the habits fetch is handled in the habits useEffect
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Fetch habits from Firestore when the screen is focused or userId changes
  useFocusEffect(
    useCallback(() => {
      if (!currentUserId) {
        console.log("IndexScreen focused, but no user ID. Clearing habits.");
        setHabits([]);
        setIsLoading(false);
        return; // Don't try to fetch if no user
      }

      console.log(`IndexScreen focused for user: ${currentUserId}. Fetching habits.`);
      const fetchHabits = async () => {
        setIsLoading(true);
        try {
          const habitsCollectionRef = collection(db, 'users', currentUserId, 'habits');
          const q = query(habitsCollectionRef); // Consider adding orderBy('createdAt', 'desc')
          const querySnapshot = await getDocs(q);
          const fetchedHabits: Habit[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt instanceof Timestamp 
                              ? data.createdAt.toDate().toISOString() 
                              : data.createdAt || new Date().toISOString();
            // Ensure completionHistory has 'count' and defaults to 0 if migrating from 'completed'
            const completionHistory = (data.completionHistory || []).map((entry: any) => ({
              date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : entry.date,
              // If migrating from old structure, 'completed: true' becomes 'count: 1' (or frequency.times if it was daily and only one click)
              // For simplicity, new habits or habits not touched by old logic will correctly use count.
              // A more robust migration would be needed for existing boolean 'completed' fields if target completions > 1
              count: typeof entry.count === 'number' ? entry.count : (entry.completed ? 1 : 0),
            }));
            fetchedHabits.push({
              id: doc.id,
              ...data,
              createdAt,
              completionHistory,
            } as Habit);
          });
          setHabits(fetchedHabits);
          console.log("Habits fetched successfully for IndexScreen:", fetchedHabits.length);
        } catch (error) {
          console.error("Error fetching habits for IndexScreen: ", error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchHabits();
      
      // Optional: Return a cleanup function if fetchHabits sets up any subscriptions
      // return () => { /* cleanup */ };
    }, [currentUserId]) // Dependency: re-run if currentUserId changes
  );

  // Calculate daily progress
  const dailyProgressPercentage = useMemo(() => {
    const today = new Date();
    const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentDayOfWeek = today.getDay(); // 0 for Sunday, 1 for Monday, ...

    const habitsScheduledForToday = habits.filter(habit => {
      if (habit.frequency.type === 'daily') {
        return true;
      }
      if (habit.frequency.type === 'weekly') {
        // Ensure habit.frequency.days is defined before calling includes
        return habit.frequency.days?.includes(currentDayOfWeek);
      }
      return false;
    });

    if (habitsScheduledForToday.length === 0) {
      return 0; // No habits scheduled for today
    }

    const fullyCompletedTodayCount = habitsScheduledForToday.filter(habit => {
      const todaysEntry = habit.completionHistory.find(entry => entry.date === todayDateString);
      if (!todaysEntry) return false;
      // For daily habits, check if count meets frequency.times. Default to 1 if times is not set.
      // For weekly habits, count >= 1 means completed for that scheduled day.
      const targetCompletions = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1;
      return todaysEntry.count >= targetCompletions;
    }).length;

    return (fullyCompletedTodayCount / habitsScheduledForToday.length) * 100;
  }, [habits]);

  const onToggleDrawer = () => {
      appNavigation.dispatch(DrawerActions.openDrawer());
  };

  const handleAddHabit = async (newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt'>) => {
    if (!currentUserId) {
      alert("You must be logged in to add habits. Please sign in.");
      return;
    }
    const newHabitId = uuidv4();
    const newHabit: Habit = {
      ...newHabitData,
      id: newHabitId, 
      streak: 0,
      longestStreak: 0,
      completionHistory: [], // Initialize with count structure
      createdAt: new Date().toISOString(),
    };

    try {
      // Add to Firestore - use a subcollection for user-specific habits
      const habitDocRef = doc(db, 'users', currentUserId, 'habits', newHabitId);
      await setDoc(habitDocRef, {
        // Explicitly list fields to save, omitting local 'id' if Firestore generates it
        name: newHabit.name,
        description: newHabit.description,
        frequency: newHabit.frequency,
        streak: newHabit.streak,
        longestStreak: newHabit.longestStreak,
        completionHistory: newHabit.completionHistory,
        createdAt: Timestamp.fromDate(new Date(newHabit.createdAt)), // Store as Firestore Timestamp
        isDefault: newHabit.isDefault,
        notes: newHabit.notes,
      });
      console.log("Habit added to Firestore with ID: ", newHabitId);
      setHabits(prevHabits => [...prevHabits, { ...newHabit, id: newHabitId }]); // Add to local state with confirmed ID
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("Error adding habit to Firestore: ", error);
      alert("Failed to save habit. Please try again.");
    }
  };

  const handleCompleteHabit = async (habitId: string) => {
    if (!currentUserId) {
        alert("You must be logged in to complete habits. Please sign in.");
        return;
    }
    const todayDateStr = new Date().toISOString().split('T')[0];
    let pointsAwarded = 0;
    let updatedHabitLocally: Habit | undefined;

    setHabits(prevHabits =>
      prevHabits.map(h => {
        if (h.id === habitId) {
          const todaysEntryIndex = h.completionHistory.findIndex(entry => entry.date === todayDateStr);
          let currentCountToday = 0;
          if (todaysEntryIndex > -1) {
            currentCountToday = h.completionHistory[todaysEntryIndex].count;
          }

          // Allow completion only if current count is less than target times for daily habits
          // For weekly habits, assume target is 1 for the day if it's a scheduled day.
          // This might need refinement if weekly habits can also have multiple completions per scheduled day.
          const targetCompletions = h.frequency.type === 'daily' ? (h.frequency.times || 1) : 1;

          if (currentCountToday >= targetCompletions) {
            console.log(`Habit ${h.name} already completed ${currentCountToday}/${targetCompletions} times today.`);
            return h; // Already fully completed for today
          }

          const newCountToday = currentCountToday + 1;
          let newStreak = h.streak;
          let newLongestStreak = h.longestStreak;

          // Award points and update streak only on the *first* completion of the day
          if (currentCountToday === 0) {
            pointsAwarded = 10; // Example points for first completion
            
            // Streak logic: Check if the habit was completed yesterday to continue the streak
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDateStr = yesterday.toISOString().split('T')[0];

            const completedYesterday = h.completionHistory.some(
              entry => entry.date === yesterdayDateStr && entry.count > 0 // Check if completed at least once yesterday
            );

            if (completedYesterday) {
              newStreak = h.streak + 1;
            } else {
              // If not completed yesterday, or if it's the first ever completion, reset/start streak
              // Check if there's ANY completion history to decide if it's a reset or first time.
              const lastCompletion = h.completionHistory.length > 0 ? h.completionHistory[h.completionHistory.length -1] : null;
              // If the last completion was not today (meaning it's a new day) and not yesterday, streak resets to 1
              if (lastCompletion && lastCompletion.date !== todayDateStr && lastCompletion.date !== yesterdayDateStr) {
                 newStreak = 1;
              } else if (!lastCompletion || lastCompletion.date !== todayDateStr) { 
                // If no last completion, or last completion was not today (it's a new day of activity)
                newStreak = 1;
              }
              // If last completion *was* today, streak already handled by `currentCountToday === 0` condition (remains same unless it's a new day)
            }
          }
          
          newLongestStreak = Math.max(h.longestStreak, newStreak);

          const updatedCompletionHistory = [...h.completionHistory];
          if (todaysEntryIndex > -1) {
            updatedCompletionHistory[todaysEntryIndex] = { ...updatedCompletionHistory[todaysEntryIndex], count: newCountToday };
          } else {
            updatedCompletionHistory.push({ date: todayDateStr, count: newCountToday });
          }
          
          updatedHabitLocally = {
            ...h,
            streak: newStreak,
            longestStreak: newLongestStreak,
            completionHistory: updatedCompletionHistory,
          };
          return updatedHabitLocally;
        }
        return h;
      })
    );

    if (updatedHabitLocally) { // updatedHabitLocally will exist if a completion was made
      try {
        const habitDocRef = doc(db, 'users', currentUserId, 'habits', habitId);
        await updateDoc(habitDocRef, {
          streak: updatedHabitLocally.streak,
          longestStreak: updatedHabitLocally.longestStreak,
          completionHistory: updatedHabitLocally.completionHistory,
        });
        if (pointsAwarded > 0) {
            console.log(`Habit ${updatedHabitLocally.name} first completion today. Awarded ${pointsAwarded} points. Progress: ${updatedHabitLocally.completionHistory.find(e=>e.date === todayDateStr)?.count}/${updatedHabitLocally.frequency.times}`);
            // Here you would also update the user's total points in Firestore
        } else {
            console.log(`Habit ${updatedHabitLocally.name} further completion today. Progress: ${updatedHabitLocally.completionHistory.find(e=>e.date === todayDateStr)?.count}/${updatedHabitLocally.frequency.times}`);
        }
      } catch (error) {
        console.error("Error updating habit in Firestore: ", error);
        alert("Failed to update habit completion. Please check your connection.");
        // Consider reverting local state if Firestore update fails
      }
    }
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const today = new Date().toISOString().split('T')[0];
    const todaysEntry = item.completionHistory.find(entry => entry.date === today);
    const currentCompletionsToday = todaysEntry ? todaysEntry.count : 0;
    
    // Target completions: for daily, it's frequency.times (default 1). For weekly, it's 1 for the day.
    const targetCompletions = item.frequency.type === 'daily' ? (item.frequency.times || 1) : 1;
    const isFullyCompletedToday = currentCompletionsToday >= targetCompletions;
    const progressPercentage = targetCompletions > 0 ? (currentCompletionsToday / targetCompletions) * 100 : 0;

    let buttonTitle = "Complete";
    if (item.frequency.type === 'daily' && (item.frequency.times || 1) > 1) {
      buttonTitle = isFullyCompletedToday ? "Completed" : `Complete (${currentCompletionsToday}/${targetCompletions})`;
    } else {
      buttonTitle = isFullyCompletedToday ? "Completed" : "Complete";
    }
    
    return (
      <TouchableOpacity onPress={() => router.push(`/habit/${item.id}` as any)}>
        <View style={styles.habitItem}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitName}>{item.name}</Text>
            <Text>Streak: {item.streak} (Longest: {item.longestStreak})</Text>
            <Text>
              Frequency: {item.frequency.type === 'daily' 
                ? `${item.frequency.times || 1} time(s) a day` 
                : `${item.frequency.times || 1} time(s) a week on ${item.frequency.days?.map((d: number) => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(', ')}`}
            </Text>
            {/* Habit Progress Bar */}
            {item.frequency.type === 'daily' && (item.frequency.times || 1) > 0 && (
                 <View style={styles.habitProgressContainer}>
                    <View style={[styles.habitProgressBarFill, { width: `${progressPercentage}%` }]} />
                 </View>
            )}
            {item.description && <Text style={styles.habitDescription}>Description: {item.description}</Text>}
            {item.notes && <Text style={styles.habitNotes}>Notes: {item.notes}</Text>}
          </View>
          <Button 
            title={buttonTitle}
            onPress={(e) => {
              e.stopPropagation(); 
              handleCompleteHabit(item.id);
            }} 
            disabled={isFullyCompletedToday} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style = {styles.container}>
      <Text style={styles.screenTitle}>My Habits</Text>

      {/* Daily Progress Bar */}
      {!isLoading && habits.length > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Daily Progress: {Math.round(dailyProgressPercentage)}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${dailyProgressPercentage}%` }]} />
          </View>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator size="large" color="#D05B52" style={styles.loader}/>
      ) : (
        <FlatList
          data={habits}
          renderItem={renderHabit}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={<Text style={styles.emptyText}>No habits yet. Add one or check your connection.</Text>}
          style={styles.list}
          extraData={habits} // Ensure FlatList re-renders when habit items change
        />
      )}
      <Button title="Add New Habit" onPress={() => setIsAddModalVisible(true)} />

      <Modal
        visible={isAddModalVisible}
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <AddHabitScreen 
          onAddHabit={handleAddHabit} 
          onCancel={() => setIsAddModalVisible(false)} 
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
    paddingHorizontal: 20,
    backgroundColor: '#f0f0f0', // Changed background slightly
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 20, // Added vertical margin
    textAlign: 'center',
  },
  progressContainer: {
    marginBottom: 15, // Spacing below progress bar
  },
  progressLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    overflow: 'hidden', // Ensures the fill stays within bounds
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50', // Green color for progress
    borderRadius: 10,
  },
  list: {
    flex: 1, // Ensure list takes available space
  },
  habitItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row', // Arrange info and button side-by-side
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2.62,
    elevation: 4,
  },
  habitInfo: {
    flex: 1, // Allow text to take up available space before button
    marginRight: 10, // Space between text and button
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  habitDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 3,
  },
  habitNotes: {
    fontSize: 14,
    color: '#777',
    fontStyle: 'italic',
    marginTop: 3,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Styles for individual habit progress bar
  habitProgressContainer: {
    height: 10, // Smaller height for individual habit progress
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    marginTop: 5,
    marginBottom: 5,
    overflow: 'hidden',
  },
  habitProgressBarFill: {
    height: '100%',
    backgroundColor: '#68B96B', // Slightly different green or same as main
    borderRadius: 5,
  },
});
