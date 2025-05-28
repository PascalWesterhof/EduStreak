import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import onAuthStateChanged and User type
import { collection, doc, getDoc, getDocs, increment, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore'; // Firestore functions
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values'; // For uuid
import Svg, { Circle, Text as SvgText } from 'react-native-svg'; // Added for Circular Progress
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../../config/firebase'; // Import db and auth
import { Habit } from '../../types'; // Adjusted path
import AddHabitScreen from '../habit/AddHabitScreen'; // Adjusted path for new location

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to get date as YYYY-MM-DD string
const getIsoDateString = (date: Date) => date.toISOString().split('T')[0];

// Helper for Circular Progress
const CircularProgress = ({ percentage, radius = 40, strokeWidth = 8, color = "#d05b52" }: { percentage: number; radius?: number; strokeWidth?: number; color?: string }) => {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
        <Circle
          stroke="#e6e6e6"
          fill="none"
          cx={(radius * 2 + strokeWidth)/2}
          cy={(radius * 2 + strokeWidth)/2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        <Circle
          stroke={color}
          fill="none"
          cx={(radius * 2 + strokeWidth)/2}
          cy={(radius * 2 + strokeWidth)/2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${ (radius * 2 + strokeWidth)/2} ${(radius * 2 + strokeWidth)/2})`}
        />
        <SvgText
            x="50%"
            y="50%"
            textAnchor="middle"
            dy=".3em"
            fontSize="16"
            fill="#000000"
            fontWeight="bold"
        >
            {`${Math.round(percentage)}%`}
        </SvgText>
      </Svg>
    </View>
  );
};

export default function Index() {
  const appNavigation = useNavigation();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For loading indicator
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Initialize to null
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userName, setUserName] = useState("User"); // Default user name

  // Listen for auth state changes
  useEffect(() => {
    setIsLoading(true); // Start loading when checking auth state
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        console.log("User is signed in with ID: ", user.uid);
        setCurrentUserId(user.uid);
        setUserName(user.displayName || "User"); // Set user display name
      } else {
        console.log("User is signed out.");
        setCurrentUserId(null);
        setHabits([]); // Clear habits if user signs out
        setUserName("User");
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
          // Add an explicit check for currentUserId and db before using them
          if (!db || typeof currentUserId !== 'string') {
            console.error("Firestore instance (db) is not available or currentUserId is not a string.");
            setIsLoading(false);
            return;
          }
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

  // Generate dates for the horizontal selector
  const dateRange = useMemo(() => {
    const range = [];
    for (let i = -2; i <= 2; i++) { // Show 5 days: 2 past, today, 2 future
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      range.push(date);
    }
    return range;
  }, [selectedDate]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    // Potentially re-filter habits or re-fetch for the selected date if needed
  };

  // Calculate daily progress for the *selectedDate*
  const dailyProgress = useMemo(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const dayOfWeek = selectedDate.getDay();

    const habitsScheduledForDay = habits.filter(habit => {
      if (habit.frequency.type === 'daily') return true;
      if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(dayOfWeek);
      return false;
    });

    if (habitsScheduledForDay.length === 0) return { count: 0, total: 0, percentage: 0 };

    const completedCount = habitsScheduledForDay.filter(habit => {
      const entry = habit.completionHistory.find(e => e.date === dateString);
      if (!entry) return false;
      const target = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1;
      return entry.count >= target;
    }).length;
    
    return {
        count: completedCount,
        total: habitsScheduledForDay.length,
        percentage: (completedCount / habitsScheduledForDay.length) * 100
    };
  }, [habits, selectedDate]);

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
    if (!currentUserId) { alert("You must be logged in to complete habits."); return; }

    const todayStr = getIsoDateString(new Date()); 
    const selectedDateStr = getIsoDateString(selectedDate);
    let wasCompletionIncremented = false;
    let didHabitBecomeFullyCompleted = false; // New flag for points

    setHabits(prevHabits =>
      prevHabits.map(h => {
        if (h.id === habitId) {
          const newCompletionHistory = [...h.completionHistory];
          const entryIndex = newCompletionHistory.findIndex(entry => entry.date === selectedDateStr);
          const targetCompletions = h.frequency.type === 'daily' ? (h.frequency.times || 1) : 1;
          let currentCompletionsToday = 0;
          let newCountForEntry = 0;

          if (entryIndex > -1) {
            currentCompletionsToday = newCompletionHistory[entryIndex].count;
            if (currentCompletionsToday < targetCompletions) {
              newCountForEntry = currentCompletionsToday + 1;
              newCompletionHistory[entryIndex] = { ...newCompletionHistory[entryIndex], count: newCountForEntry };
              wasCompletionIncremented = true;
              if (newCountForEntry >= targetCompletions) {
                didHabitBecomeFullyCompleted = true; // Habit is now fully complete for selectedDate
              }
            }
          } else {
            newCountForEntry = 1;
            newCompletionHistory.push({ date: selectedDateStr, count: newCountForEntry });
            wasCompletionIncremented = true;
            if (newCountForEntry >= targetCompletions) {
              didHabitBecomeFullyCompleted = true; // Habit is now fully complete for selectedDate
            }
          }
          return { ...h, completionHistory: newCompletionHistory };
        }
        return h;
      })
    );

    if (wasCompletionIncremented) {
      // Update Firestore for the specific habit's completionHistory
      const habitDocRef = doc(db, 'users', currentUserId, 'habits', habitId);
      const habitToUpdate = habits.find(h => h.id === habitId);
      let firestoreCompletionHistoryForHabit: {date: string, count: number}[] = [];
      if(habitToUpdate){ // Construct the latest history for this habit
        const tempHabit = { ...habitToUpdate }; 
        const entryIndex = tempHabit.completionHistory.findIndex(e => e.date === selectedDateStr);
        if (entryIndex > -1) { tempHabit.completionHistory[entryIndex].count = tempHabit.completionHistory[entryIndex].count +1 > (tempHabit.frequency.times || 1) && tempHabit.frequency.type ==='daily' ? (tempHabit.frequency.times || 1) : tempHabit.completionHistory[entryIndex].count +1;}
        else { tempHabit.completionHistory.push({ date: selectedDateStr, count: 1 });}
        firestoreCompletionHistoryForHabit = tempHabit.completionHistory.map(e => ({date: e.date, count: e.count}));
      }

      try {
        await updateDoc(habitDocRef, { completionHistory: firestoreCompletionHistoryForHabit }); 
        console.log('Habit ' + habitId + ' completion history updated.');
      } catch (error) { console.error("Error updating habit completion: ", error); }

      // Award points only if this specific habit became fully completed due to this action
      if (didHabitBecomeFullyCompleted) {
        const userDocRef = doc(db, "users", currentUserId);
        try {
          await updateDoc(userDocRef, { points: increment(10) }); // Award 10 points
          console.log('User ' + currentUserId + ' awarded 10 points for completing habit ' + habitId);
        } catch (error) { console.error("Error awarding points: ", error); }
      }
      
      // Call the function to check for daily streak after habit state might have changed
      // This needs to be called carefully, potentially after setHabits has flushed
      // For now, let's call it, but be mindful of state synchronization for the check
      await checkAndUpdateDailyStreak(); 
    }
  };

  // New function to check all daily habits and update overall user streak
  const checkAndUpdateDailyStreak = async () => {
    if (!currentUserId) return;

    const todayStr = getIsoDateString(new Date());
    let allTodaysHabitsCompleted = true;

    // Filter for habits scheduled for *today*
    const todaysScheduledHabits = habits.filter(h => {
      const dayOfWeek = new Date().getDay(); // Today's day index
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'weekly') return h.frequency.days?.includes(dayOfWeek);
      return false;
    });

    if (todaysScheduledHabits.length === 0) {
      // No habits scheduled for today, so can't complete all daily habits.
      // Or, decide if this means the streak is maintained by default (e.g. a rest day)
      // For now, let's assume streak is not updated if no habits are scheduled for today.
      console.log("No habits scheduled for today. Streak not updated.");
      return; 
    }

    for (const habit of todaysScheduledHabits) {
      const targetCompletions = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1;
      const todaysEntry = habit.completionHistory.find(entry => entry.date === todayStr);
      if (!todaysEntry || todaysEntry.count < targetCompletions) {
        allTodaysHabitsCompleted = false;
        break;
      }
    }

    if (allTodaysHabitsCompleted) {
      console.log("All habits for today are completed! Updating daily streak.");
      const userDocRef = doc(db, "users", currentUserId);
      try {
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          let newCurrentStreak = userData.currentStreak || 0;
          let newLongestStreak = userData.longestStreak || 0;
          const lastCompletionDate = userData.lastCompletionDate; // This is the user's overall last daily completion

          // IMPORTANT: Streak logic is for *overall daily activity*, not per-habit streak.
          // It updates only if ALL of today's habits are done, and it's the first time today this condition is met.
          if (lastCompletionDate !== todayStr) { // Check if we haven't already awarded streak for today
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = getIsoDateString(yesterday);

            if (userData.lastCompletionDate === yesterdayStr) {
              newCurrentStreak += 1;
            } else {
              newCurrentStreak = 1; // Reset if last completion wasn't yesterday
            }
            if (newCurrentStreak > newLongestStreak) {
              newLongestStreak = newCurrentStreak;
            }
            // Update user document with new streak and today as lastCompletionDate
            await updateDoc(userDocRef, {
              currentStreak: newCurrentStreak,
              longestStreak: newLongestStreak,
              lastCompletionDate: todayStr 
            });
            console.log('User ' + currentUserId + ' daily streak updated to ' + newCurrentStreak);
          } else {
            console.log("Daily streak already awarded for today or condition not met previously.");
          }
        }
      } catch (error) {
        console.error("Error updating user daily streak: ", error);
      }
    } else {
      console.log("Not all habits for today are completed. Daily streak not updated yet.");
    }
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const dateString = getIsoDateString(selectedDate);
    const todaysEntry = item.completionHistory.find(entry => entry.date === dateString);
    const currentCompletions = todaysEntry ? todaysEntry.count : 0;
    const targetCompletions = item.frequency.type === 'daily' ? (item.frequency.times || 1) : 1;
    const isFullyCompleted = currentCompletions >= targetCompletions;
    const progress = targetCompletions > 0 ? (currentCompletions / targetCompletions) * 100 : 0;
    const showCircularProgress = item.frequency.type === 'daily' && (item.frequency.times || 1) > 1;
    const isButtonDisabled = getIsoDateString(selectedDate) !== getIsoDateString(new Date()) || isFullyCompleted;

    return (
      <View style={styles.habitCard}>
        <TouchableOpacity style={styles.habitInfoTouchable} onPress={() => router.push(`/habit/${item.id}`)}>
          <Text style={styles.habitName}>{item.name}</Text>
          {showCircularProgress ? 
            (<CircularProgress percentage={progress} radius={25} strokeWidth={5} />) : 
            (<Text style={styles.habitPercentageText}>{`${Math.round(progress)}% completed`}</Text>)}
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.completeButton, isButtonDisabled ? styles.completedButton : {}]} 
          onPress={() => handleCompleteHabit(item.id)}
          disabled={isButtonDisabled}
        >
          <Text style={styles.completeButtonText}>{isFullyCompleted ? "COMPLETED" : "COMPLETE"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return <View style={styles.loaderContainer}><ActivityIndicator size="large" color="#d05b52" /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => appNavigation.dispatch(DrawerActions.openDrawer())}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <Text style={styles.greetingText}>Hello, <Text style={styles.userNameText}>{userName}!</Text></Text>
      </View>

      {/* Date Selector */}
      <View style={styles.dateSelectorContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScrollContent}>
          {dateRange.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity key={index} onPress={() => handleDateSelect(date)} style={[styles.dateItem, isSelected && styles.selectedDateItem]}>
                <Text style={[styles.dateDayText, isSelected && styles.selectedDateText]}>{days[date.getDay()]}</Text>
                <Text style={[styles.dateNumberText, isSelected && styles.selectedDateText]}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
         <TouchableOpacity onPress={() => { /* Logic to go to next set of dates or a calendar picker */ }}>
             <Text style={styles.dateChevron}>{`>>`}</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Progress */}
      <View style={styles.overallProgressContainer}>
        <CircularProgress percentage={dailyProgress.percentage} radius={60} strokeWidth={10} />
        <Text style={styles.progressText}>{dailyProgress.count}/{dailyProgress.total} habits completed</Text>
      </View>

      {/* Habits List */}
      <FlatList
        data={habits.filter(habit => {
            const dayOfWeek = selectedDate.getDay();
            if (habit.frequency.type === 'daily') return true;
            if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(dayOfWeek);
            return false;
        })}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        numColumns={2} // For grid layout
        columnWrapperStyle={styles.row}
        ListEmptyComponent={<Text style={styles.emptyText}>No habits scheduled for {selectedDate.toDateString()}.</Text>}
        contentContainerStyle={styles.listContentContainer}
      />

      <TouchableOpacity style={styles.addHabitFab} onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles.addHabitFabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={isAddModalVisible} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <AddHabitScreen onAddHabit={handleAddHabit} onCancel={() => setIsAddModalVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8', // Light greyish background
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6F8',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    marginRight: 15,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50', // Darker text color
  },
  userNameText: {
    color: '#d05b52', // Theme color for user name
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  dateScrollContent: {
    alignItems: 'center',
  },
  dateItem: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  selectedDateItem: {
    backgroundColor: '#d05b52',
  },
  dateDayText: {
    fontSize: 12,
    color: '#7f8c8d', // Greyish text
  },
  dateNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  selectedDateText: {
    color: '#FFFFFF',
  },
  dateChevron: {
      fontSize: 20,
      color: '#7f8c8d',
      paddingHorizontal: 10,
  },
  overallProgressContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressText: {
    fontSize: 16,
    color: '#d05b52',
    marginTop: 10,
    fontWeight: 'bold',
  },
  listContentContainer: {
    paddingHorizontal: 15,
  },
   row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  habitCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    width: '48%', // For 2 columns with a bit of space
    aspectRatio: 1, // Makes it a square
    justifyContent: 'space-between', // Pushes button to bottom
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitInfoTouchable: {
      alignItems: 'center', // Center name and progress/text
      width: '100%',
  },
  habitName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 8,
  },
  habitPercentageText: {
    fontSize: 14,
    color: '#d05b52',
  },
  habitProgressCircleContainer: {
      marginVertical: 8,
  },
  completeButton: {
    backgroundColor: '#d05b52',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    marginTop: 'auto', // Pushes button to bottom when habitInfoTouchable content is small
  },
  completedButton: {
    backgroundColor: '#7f8c8d', // Greyed out when completed
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: 'gray',
  },
  addHabitFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#d05b52',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  addHabitFabText: {
    fontSize: 30,
    color: 'white',
  },
});
