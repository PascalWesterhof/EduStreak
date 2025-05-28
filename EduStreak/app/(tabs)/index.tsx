import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import onAuthStateChanged and User type
import { collection, doc, getDocs, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore'; // Firestore functions
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values'; // For uuid
import Svg, { Circle, Text as SvgText } from 'react-native-svg'; // Added for Circular Progress
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../../config/firebase'; // Import db and auth
import { Habit } from '../../types'; // Adjusted path
import AddHabitScreen from '../AddHabitScreen'; // Adjusted path

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
    if (!currentUserId) {
        alert("You must be logged in to complete habits. Please sign in.");
        return;
    }
    const dateStr = selectedDate.toISOString().split('T')[0];
    let pointsAwarded = 0;
    let updatedHabitLocally: Habit | undefined;

    setHabits(prevHabits =>
      prevHabits.map(h => {
        if (h.id === habitId) {
          const todaysEntryIndex = h.completionHistory.findIndex(entry => entry.date === dateStr);
          let currentCountToday = 0;
          if (todaysEntryIndex > -1) {
            currentCountToday = h.completionHistory[todaysEntryIndex].count;
          }

          const targetCompletions = h.frequency.type === 'daily' ? (h.frequency.times || 1) : 1;

          if (currentCountToday >= targetCompletions) {
            console.log(`Habit ${h.name} already completed ${currentCountToday}/${targetCompletions} times today.`);
            return h; 
          }

          const newCountToday = currentCountToday + 1;
          let newStreak = h.streak;
          let newLongestStreak = h.longestStreak;
          let newCompletionHistory = [...h.completionHistory];

          if (todaysEntryIndex > -1) {
            newCompletionHistory[todaysEntryIndex] = { ...newCompletionHistory[todaysEntryIndex], count: newCountToday };
          } else {
            newCompletionHistory.push({ date: dateStr, count: newCountToday });
          }

          if (newCountToday >= targetCompletions) {
            pointsAwarded = 10; 
            
            newStreak += 1; 
            if (newStreak > newLongestStreak) {
              newLongestStreak = newStreak;
            }
            console.log(`Habit ${h.name} fully completed for today. Streak: ${newStreak}, Points: ${pointsAwarded}`);

          } else {
            console.log(`Habit ${h.name} progress: ${newCountToday}/${targetCompletions}. No points yet.`);
          }

          updatedHabitLocally = {
            ...h,
            streak: newStreak,
            longestStreak: newLongestStreak,
            completionHistory: newCompletionHistory,
          };
          return updatedHabitLocally;
        }
        return h;
      })
    );

    if (updatedHabitLocally) { 
      try {
        const habitDocRef = doc(db, 'users', currentUserId!, 'habits', habitId); // Added non-null assertion for currentUserId
        await updateDoc(habitDocRef, {
          streak: updatedHabitLocally.streak,
          longestStreak: updatedHabitLocally.longestStreak,
          completionHistory: updatedHabitLocally.completionHistory,
        });
        // console.log(`Habit ${updatedHabitLocally.name} updated in Firestore. Progress: ${newCountToday}/${targetCompletions}`);
      } catch (error) {
        console.error("Error updating habit in Firestore: ", error);
        alert("Failed to update habit completion. Please check your connection.");
      }
    }

    if (pointsAwarded > 0 && updatedHabitLocally && currentUserId) { // Added check for currentUserId
      console.log(`Awarded ${pointsAwarded} points for completing ${updatedHabitLocally.name}. (Firestore update would go here)`);
      const userProfileRef = doc(db, "users", currentUserId, "profile", "userData");
      try {
        // IMPORTANT: Ensure you have 'increment' imported from 'firebase/firestore'
        // import { increment } from 'firebase/firestore';
        // await updateDoc(userProfileRef, {
        //   points: increment(pointsAwarded) 
        // });
        // console.log("Points updated in Firestore.");
      } catch (err) {
        // console.error("Error updating points in Firestore: ", err);
      }
    }
  };

  const renderHabit = ({ item }: { item: Habit }) => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const todaysEntry = item.completionHistory.find(entry => entry.date === dateString);
    const currentCompletions = todaysEntry ? todaysEntry.count : 0;
    
    // Target completions: for daily, it's frequency.times (default 1). For weekly, it's 1 for the day.
    const targetCompletions = item.frequency.type === 'daily' ? (item.frequency.times || 1) : 1;
    const isFullyCompleted = currentCompletions >= targetCompletions;
    const progress = targetCompletions > 0 ? (currentCompletions / targetCompletions) * 100 : 0;

    const showCircularProgress = item.frequency.type === 'daily' && (item.frequency.times || 1) > 1;

    return (
      <View style={styles.habitCard}>
        <TouchableOpacity style={styles.habitInfoTouchable} onPress={() => router.push(`/habit/${item.id}`)}>
            <Text style={styles.habitName}>{item.name}</Text>
            {showCircularProgress ? (
                 <View style={styles.habitProgressCircleContainer}>
                    <CircularProgress percentage={progress} radius={25} strokeWidth={5} />
                 </View>
            ) : (
                <Text style={styles.habitPercentageText}>{Math.round(progress)}% completed</Text>
            )}
        </TouchableOpacity>
        <TouchableOpacity 
            style={[styles.completeButton, isFullyCompleted ? styles.completedButton : {}]} 
            onPress={() => handleCompleteHabit(item.id)}
            disabled={isFullyCompleted}
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
             <Text style={styles.dateChevron}>{'>'}{'>'}</Text>
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
