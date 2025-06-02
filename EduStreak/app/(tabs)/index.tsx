import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import onAuthStateChanged and User type
import { addDoc, collection, doc, getDoc, getDocs, increment, query, setDoc, Timestamp, updateDoc } from 'firebase/firestore'; // Firestore functions
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values'; // For uuid
import Svg, { Circle, Text as SvgText } from 'react-native-svg'; // Added for Circular Progress bar
import { v4 as uuidv4 } from 'uuid';
import { auth, db } from '../../config/firebase'; // Import db and auth
import { colors } from '../../constants/Colors'; // Import global colors
import { globalStyles } from '../../styles/globalStyles'; // Import global styles
import { Habit, InAppNotification } from '../../types'; // Path for types
import AddHabitScreen from '../habit/AddHabitScreen';

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to get date as YYYY-MM-DD string
const getIsoDateString = (date: Date) => date.toISOString().split('T')[0];

// Helper for Circular Progress
const CircularProgress = ({ percentage, radius = 40, strokeWidth = 8, color = colors.accent }: { percentage: number; radius?: number; strokeWidth?: number; color?: string }) => {
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg height={radius * 2 + strokeWidth} width={radius * 2 + strokeWidth}>
        <Circle
          stroke={colors.lightGray}
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
            fill={colors.black}
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
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Listen for auth state changes and fetch habits when the screen is focused or userId/auth state changes
  useFocusEffect(
    useCallback(() => {
      setIsLoading(true); // Start loading when checking auth state or focusing
      console.log("IndexScreen focus effect running.");

      const authUnsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          console.log("IndexScreen: User is signed in with ID: ", user.uid, "Name:", user.displayName);
          setCurrentUserId(user.uid);
          setUserName(user.displayName || "User"); // Set user display name
        } else {
          console.log("IndexScreen: User is signed out.");
          setCurrentUserId(null);
          setHabits([]); // Clear habits if user signs out
          setInAppNotifications([]); // Clear notifications
          setUnreadNotificationCount(0);
          setUserName("User");
          setIsLoading(false); 
        }
      });

      if (!currentUserId) {
        console.log("IndexScreen: No user ID during focus. Clearing habits and notifications.");
        setHabits([]);
        setInAppNotifications([]);
        setUnreadNotificationCount(0);
        if (auth.currentUser === null) setIsLoading(false);
        return () => {
          console.log("IndexScreen: Cleaning up auth listener (no user path).");
          authUnsubscribe();
        };
      }

      console.log(`IndexScreen: User ${currentUserId} is present. Fetching data.`);
      const fetchData = async () => {
        try {
          if (!db || typeof currentUserId !== 'string') {
            console.error("Firestore instance (db) is not available or currentUserId is not a string.");
            return;
          }
          // Fetch Habits
          const habitsCollectionRef = collection(db, 'users', currentUserId, 'habits');
          const habitsQuery = query(habitsCollectionRef);
          const habitsSnapshot = await getDocs(habitsQuery);
          const fetchedHabits: Habit[] = [];
          habitsSnapshot.forEach((doc) => {
            const data = doc.data();
            const createdAt = data.createdAt instanceof Timestamp 
                              ? data.createdAt.toDate().toISOString() 
                              : data.createdAt || new Date().toISOString();
            const completionHistory = (data.completionHistory || []).map((entry: any) => ({
              date: entry.date instanceof Timestamp ? entry.date.toDate().toISOString().split('T')[0] : entry.date,
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

          // Fetch In-App Notifications
          const notificationsCollectionRef = collection(db, 'users', currentUserId, 'inAppNotifications');
          // Optionally, order by timestamp descending: const notificationsQuery = query(notificationsCollectionRef, orderBy("timestamp", "desc"));
          const notificationsQuery = query(notificationsCollectionRef);
          const notificationsSnapshot = await getDocs(notificationsQuery);
          const fetchedNotifications: InAppNotification[] = [];
          let unreadCount = 0;
          notificationsSnapshot.forEach((doc) => {
            const data = doc.data();
            const notification = {
              id: doc.id,
              ...data,
              timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate().toISOString() : data.timestamp,
            } as InAppNotification;
            fetchedNotifications.push(notification);
            if (!notification.read) {
              unreadCount++;
            }
          });
          setInAppNotifications(fetchedNotifications);
          setUnreadNotificationCount(unreadCount);
          console.log("In-app notifications fetched:", fetchedNotifications.length, "Unread:", unreadCount);

        } catch (error) {
          console.error("Error fetching data for IndexScreen: ", error);
        } finally {
          setIsLoading(false); 
        }
      };

      fetchData();
      
      return () => {
        console.log("IndexScreen: Cleaning up auth listener (user path).");
        authUnsubscribe();
      };
    }, [currentUserId]) 
  );

  const checkAndCreateReminderNotifications = async () => {
    if (!currentUserId || getIsoDateString(selectedDate) !== getIsoDateString(new Date())) {
      return; // Only run for current user and if selectedDate is today
    }

    const now = new Date();
    const todayStr = getIsoDateString(now);
    const dayOfWeek = now.getDay();

    const habitsScheduledForToday = habits.filter(habit => {
      if (habit.frequency.type === 'daily') return true;
      if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(dayOfWeek);
      return false;
    });

    for (const habit of habitsScheduledForToday) {
      // Skip if habit is already fully completed for today
      const habitEntry = habit.completionHistory.find(e => e.date === todayStr);
      const targetCompletions = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1;
      const isHabitCompleted = habitEntry && habitEntry.count >= targetCompletions;
      if (isHabitCompleted) {
        // console.log(`Habit '${habit.name}' already completed. Skipping reminder.`);
        continue;
      }

      // Check for custom reminder time for this specific habit
      if (habit.reminderTime) {
        const [hours, minutes] = habit.reminderTime.split(':').map(Number);
        const reminderDateTime = new Date(now);
        reminderDateTime.setHours(hours, minutes, 0, 0);

        if (now >= reminderDateTime) {
          // Check if a reminder for this specific habit and for today already exists
          const existingReminderForHabitToday = inAppNotifications.find(n => {
            if (n.type === 'reminder' && n.relatedHabitId === habit.id) {
              // Check if the notification's timestamp is for today
              const notificationDateStr = getIsoDateString(new Date(n.timestamp));
              return notificationDateStr === todayStr;
            }
            return false;
          });

          if (!existingReminderForHabitToday) {
            console.log(`Creating reminder for specific habit: ${habit.name} at ${habit.reminderTime}`);
            const newNotification: Omit<InAppNotification, 'id'> = {
              message: `Reminder: It's time for '${habit.name}'! Don't forget to complete it. `,
              timestamp: now.toISOString(),
              read: false,
              type: 'reminder',
              relatedHabitId: habit.id,
            };
            try {
              const notificationsCollectionRef = collection(db, 'users', currentUserId, 'inAppNotifications');
              const docRef = await addDoc(notificationsCollectionRef, newNotification);
              const notificationToAdd = { ...newNotification, id: docRef.id };
              setInAppNotifications(prev => [...prev, notificationToAdd].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
              setUnreadNotificationCount(prev => prev + 1);
            } catch (error) {
              console.error(`Error creating reminder for ${habit.name}: `, error);
            }
          }
        }
      } 
      // General end-of-day reminder (fallback if no specific reminder or if that logic is kept separate)
      // For now, this is merged. If habit.reminderTime is not set, this won't trigger for this habit.
      // The old generic 8 PM reminder logic is effectively replaced by per-habit reminders.
    }
    // The old generic 8 PM reminder can be removed or adapted if needed as a fallback
  };

  // useEffect to run reminder check 
  useEffect(() => {
    if (getIsoDateString(selectedDate) === getIsoDateString(new Date())) {
      checkAndCreateReminderNotifications();
    }
  }, [habits, selectedDate, currentUserId]);

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
    // Construct the full habit object including all potential fields from newHabitData
    const newHabit: Habit = {
      ...newHabitData, // Spread first to include description, notes, reminderTime if present
      id: newHabitId, 
      streak: 0,
      longestStreak: 0,
      completionHistory: [],
      createdAt: new Date().toISOString(),
      // isDefault will be handled by dataToSave construction if not in newHabitData
    };

    try {
      const habitDocRef = doc(db, 'users', currentUserId, 'habits', newHabitId);
      
      // Prepare data for Firestore, excluding undefined optional fields
      const dataToSave: any = {
        name: newHabit.name, // name is required
        frequency: newHabit.frequency, // frequency is required
        streak: newHabit.streak, // required, initialized to 0
        longestStreak: newHabit.longestStreak, // required, initialized to 0
        completionHistory: newHabit.completionHistory, // required, initialized to []
        createdAt: Timestamp.fromDate(new Date(newHabit.createdAt)), // required
        isDefault: newHabit.isDefault || false, // Ensure boolean, default to false if undefined
      };

      // Conditionally add optional fields to dataToSave
      if (newHabit.description !== undefined) {
        dataToSave.description = newHabit.description;
      }
      if (newHabit.notes !== undefined) {
        dataToSave.notes = newHabit.notes;
      }
      if (newHabit.reminderTime !== undefined) {
        dataToSave.reminderTime = newHabit.reminderTime;
      }

      await setDoc(habitDocRef, dataToSave);
      console.log("Habit added to Firestore with ID: ", newHabitId);
      setHabits(prevHabits => [...prevHabits, newHabit]); // Add the full newHabit object to local state
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
    return <View style={globalStyles.centeredContainer}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => appNavigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButtonContainer}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <Text style={styles.greetingText}>Hello, <Text style={styles.userNameText}>{userName}!</Text></Text>
        <TouchableOpacity onPress={() => router.push('/notifications/notifications')} style={styles.notificationIconButton}>
          <Image source={require('../../assets/icons/bell_icon.png')} style={styles.notificationBellIcon} /> 
          {unreadNotificationCount > 0 && (
            <View style={styles.notificationBadgeOnIcon}>
              <Text style={styles.notificationBadgeText}>{unreadNotificationCount > 0 ? unreadNotificationCount : ''}</Text>
            </View>
          )}
        </TouchableOpacity>
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
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 10,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  menuButtonContainer: {
    position: 'relative',
    padding: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notificationBadgeText: {
    color: colors.primaryText,
    fontSize: 10,
    fontWeight: 'bold',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textDefault,
    textAlign: 'center',
    marginHorizontal: 10,
  },
  userNameText: {
    color: colors.accent,
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
    backgroundColor: colors.cardBackground,
  },
  selectedDateItem: {
    backgroundColor: colors.accent,
  },
  dateDayText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  dateNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textDefault,
  },
  selectedDateText: {
    color: colors.primaryText,
  },
  dateChevron: {
      fontSize: 20,
      color: colors.textMuted,
      paddingHorizontal: 10,
  },
  overallProgressContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  progressText: {
    fontSize: 16,
    color: colors.accent,
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
    backgroundColor: colors.cardBackground,
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
    color: colors.textDefault,
    textAlign: 'center',
    marginBottom: 8,
  },
  habitPercentageText: {
    fontSize: 14,
    color: colors.accent,
  },
  habitProgressCircleContainer: {
      marginVertical: 8,
  },
  completeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    marginTop: 'auto', // Pushes button to bottom when habitInfoTouchable content is small
  },
  completedButton: {
    backgroundColor: colors.textMuted,
  },
  completeButtonText: {
    color: colors.primaryText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: colors.textMuted,
  },
  addHabitFab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: colors.accent,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  addHabitFabText: {
    fontSize: 30,
    color: colors.primaryText,
  },
  notificationIconButton: {
    position: 'relative',
    padding: 10,
  },
  notificationBellIcon: { 
    width: 24, 
    height: 24, 
    resizeMode: 'contain',
  },
  notificationBadgeOnIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.error,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    paddingHorizontal: 4,
  },
});
