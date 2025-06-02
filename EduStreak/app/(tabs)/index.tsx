import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth'; // Import onAuthStateChanged and User type
import { doc, increment, updateDoc } from 'firebase/firestore'; // Firestore functions
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values'; // For uuid
import { CircularProgress } from '../../components/CircularProgress'; // Added import
import { auth, db } from '../../config/firebase'; // Import db and auth
import { colors } from '../../constants/Colors'; // Import global colors
import {
  addNewHabit as addNewHabitService,
  checkAndCreateReminderNotificationsLogic as checkAndCreateReminderNotificationsService // Import service
  ,





  completeHabitLogic as completeHabitService,
  fetchUserHabitsAndNotifications,
  updateDailyStreakLogic as updateDailyStreakService
} from '../../services/habitService'; // Import the service
import { globalStyles } from '../../styles/globalStyles'; // Import global styles
import { Habit, InAppNotification } from '../../types'; // Path for types
import { getIsoDateString } from '../../utils/dateUtils'; // Added import
import AddHabitScreen from '../habit/AddHabitScreen';

/**
 * Array of day abbreviations for the date selector.
 */
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * `Index` component serves as the Home screen of the application.
 * It displays the user's habits for a selected date, overall daily progress,
 * and provides functionality to add new habits, complete habits, and navigate to notifications.
 * It also handles user authentication state to fetch and display user-specific data.
 */
export default function Index() {
  const appNavigation = useNavigation();
  const router = useRouter();

  // State for habits, modal visibility, loading status, user ID, selected date, etc.
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // For loading indicator
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Initialize to null
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [userName, setUserName] = useState("User"); // Default user name
  const [inAppNotifications, setInAppNotifications] = useState<InAppNotification[]>([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  /**
   * `useFocusEffect` hook to manage actions when the screen comes into focus.
   * - Resets `selectedDate` to the current day if it's in the past.
   * - Sets up an `onAuthStateChanged` listener to get the current user.
   * - Fetches user habits and notifications if a user is logged in.
   * - Clears local data if the user signs out.
   */
  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      const todayIso = getIsoDateString(today);
      // Ensure selectedDate is always today upon focusing, if it was a past or future date.
      if (getIsoDateString(selectedDate) !== todayIso) {
        console.log(`[IndexScreen] Focus: selectedDate (${getIsoDateString(selectedDate)}) is not today. Resetting to today (${todayIso}).`);
        setSelectedDate(today);
      }

      setIsLoading(true); 
      console.log("[IndexScreen] Focus effect triggered.");

      const authUnsubscribe = onAuthStateChanged(auth, (user: User | null) => {
        if (user) {
          console.log("[IndexScreen] Auth: User signed in - ID:", user.uid, "Name:", user.displayName);
          setCurrentUserId(user.uid);
          setUserName(user.displayName || "User"); 
        } else {
          console.log("[IndexScreen] Auth: User signed out.");
          setCurrentUserId(null);
          setHabits([]); 
          setInAppNotifications([]); 
          setUnreadNotificationCount(0);
          setUserName("User");
          setIsLoading(false); 
        }
      });

      // If no user is found immediately after auth check, clear data and stop loading.
      if (!auth.currentUser) {
          console.log("[IndexScreen] Focus: No authenticated user found initially.");
          setHabits([]);
          setInAppNotifications([]);
          setUnreadNotificationCount(0);
          setIsLoading(false);
          return () => {
            console.log("[IndexScreen] Cleanup: Auth listener (no initial user path).");
            authUnsubscribe();
          };
      }
      
      // If there is a currentUserId (either from initial state or set by onAuthStateChanged)
      if (currentUserId) {
          console.log(`[IndexScreen] Focus: User ${currentUserId} present. Fetching data via service.`);
          const loadData = async () => {
            try {
              const { habits: fetchedHabits, notifications: fetchedNotifications, unreadCount } = await fetchUserHabitsAndNotifications(currentUserId);
              setHabits(fetchedHabits);
              setInAppNotifications(fetchedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
              setUnreadNotificationCount(unreadCount);
              console.log("[IndexScreen] Data fetched and set successfully.");
            } catch (error) {
              console.error("[IndexScreen] Error loading data via service: ", error);
            } finally {
              setIsLoading(false); 
            }
          };
          loadData();
      } else if (!auth.currentUser) {
        // This case handles if currentUserId was null and onAuthStateChanged also resulted in no user.
        setIsLoading(false);
      }
      
      // Cleanup function for the auth listener
      return () => {
        console.log("[IndexScreen] Cleanup: Auth listener (main path).");
        authUnsubscribe();
      };
    }, [currentUserId]) // Rerun effect if currentUserId changes
  );

  /**
   * Toggles the main application drawer open.
   */
  const onToggleDrawer = () => {
      appNavigation.dispatch(DrawerActions.openDrawer());
  };

  /**
   * Handles adding a new habit.
   * Calls the `addNewHabitService` to persist the habit in Firestore and updates local state.
   * @param newHabitData Data for the new habit, excluding system-generated fields.
   */
  const handleAddHabit = async (newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt'>) => {
    if (!currentUserId) {
      alert("You must be logged in to add habits. Please sign in.");
      return;
    }
    try {
      const newHabitFromService = await addNewHabitService(currentUserId, newHabitData);
      console.log("[IndexScreen] Habit added via service. ID:", newHabitFromService.id);
      setHabits(prevHabits => [...prevHabits, newHabitFromService]); 
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("[IndexScreen] Error in handleAddHabit: ", error);
      alert("Failed to save habit. Please try again.");
    }
  };

  /**
   * Handles the completion of a habit for the `selectedDate`.
   * Calls `completeHabitService` to update Firestore and then updates the local habit state.
   * Awards points if the habit becomes fully completed and checks/updates the daily streak.
   * @param habitId The ID of the habit to mark as complete/increment.
   */
  const handleCompleteHabit = async (habitId: string) => {
    if (!currentUserId) { 
      alert("You must be logged in to complete habits."); 
      return; 
    }

    const selectedDateStr = getIsoDateString(selectedDate);

    try {
      const { updatedHabit, habitBecameFullyCompleted, wasIncremented } = await completeHabitService(
        currentUserId,
        habitId,
        selectedDateStr,
        habits 
      );

      if (wasIncremented && updatedHabit) {
        const newHabitsState = habits.map(h => (h.id === updatedHabit.id ? updatedHabit : h));
        setHabits(newHabitsState);
        console.log(`[IndexScreen] Habit ${habitId} state updated locally after completion.`);

        if (habitBecameFullyCompleted) {
          const userDocRef = doc(db, "users", currentUserId);
          try {
            await updateDoc(userDocRef, { points: increment(10) });
            console.log(`[IndexScreen] User ${currentUserId} awarded 10 points for completing habit ${habitId} on ${selectedDateStr}`);
          } catch (error) { console.error("[IndexScreen] Error awarding points: ", error); }
        }
        
        // Only check streak if completion was for today
        if (getIsoDateString(selectedDate) === getIsoDateString(new Date())) {
          await checkAndUpdateDailyStreak(newHabitsState); 
        }
      } else if (updatedHabit) {
        console.log(`[IndexScreen] Habit ${habitId} completion not incremented for ${selectedDateStr} (already fully completed or target met).`);
      } else {
        console.warn("[IndexScreen] updatedHabit was undefined after completeHabitService call, unexpected issue.")
      }
    } catch (error) {
      console.error("[IndexScreen] Error in handleCompleteHabit: ", error);
      alert("Failed to update habit completion. Please try again.");
    }
  };

  /**
   * Checks and updates the user's daily streak by calling `updateDailyStreakService`.
   * This is typically called after a habit is completed on the current day.
   * @param habitsForStreakCheck The current array of habits to be evaluated for the streak.
   */
  const checkAndUpdateDailyStreak = async (habitsForStreakCheck: Habit[]) => {
    if (!currentUserId) {
        console.log("[IndexScreen] No user ID, cannot update daily streak.");
        return;
    }
    try {
        console.log("[IndexScreen] Calling daily streak update service.");
        await updateDailyStreakService(currentUserId, habitsForStreakCheck);
    } catch (error) {
        console.error("[IndexScreen] Error from updateDailyStreakService (service should handle internal errors):", error);
    }
  };

  /**
   * Checks for due habit reminders and creates in-app notifications using `checkAndCreateReminderNotificationsService`.
   * Updates local notification state if a new reminder is created.
   * This effect runs when habits, selectedDate, currentUserId, or inAppNotifications change.
   */
  const checkAndCreateReminderNotifications = async () => {
    if (!currentUserId || !habits.length) {
      return;
    }
    try {
      const newNotification = await checkAndCreateReminderNotificationsService(
        currentUserId,
        habits,
        inAppNotifications,
        selectedDate 
      );

      if (newNotification) {
        setInAppNotifications(prev => [...prev, newNotification].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
        setUnreadNotificationCount(prev => prev + 1);
        console.log("[IndexScreen] New reminder notification added via service.");
      }
    } catch (error) {
      console.error("[IndexScreen] Error from checkAndCreateReminderNotificationsService: ", error);
    }
  };

  useEffect(() => {
    // Only run reminder check if the selected date is today.
    if (getIsoDateString(selectedDate) === getIsoDateString(new Date())) {
      checkAndCreateReminderNotifications();
    }
  }, [habits, selectedDate, currentUserId, inAppNotifications]); 

  /**
   * `useMemo` hook to generate the date range for the horizontal date selector.
   * Shows 5 days: 2 past, current `selectedDate`, and 2 future relative to `selectedDate`.
   */
  const dateRange = useMemo(() => {
    const range = [];
    for (let i = -2; i <= 2; i++) { 
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      range.push(date);
    }
    return range;
  }, [selectedDate]);

  /**
   * Handles selection of a date from the horizontal date selector.
   * @param date The newly selected date.
   */
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  /**
   * `useMemo` hook to calculate the daily progress (completed habits vs. total scheduled) for the `selectedDate`.
   * Filters habits based on their frequency (daily or weekly) for the selected day.
   * @returns An object with `count` (completed), `total` (scheduled), and `percentage`.
   */
  const dailyProgress = useMemo(() => {
    const dateString = getIsoDateString(selectedDate);
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
      const target = habit.frequency.type === 'daily' ? (habit.frequency.times || 1) : 1; // Corrected: item -> habit
      return entry.count >= target;
    }).length;
    
    return {
        count: completedCount,
        total: habitsScheduledForDay.length,
        percentage: habitsScheduledForDay.length > 0 ? (completedCount / habitsScheduledForDay.length) * 100 : 0
    };
  }, [habits, selectedDate]);

  /**
   * Renders a single habit item for the FlatList.
   * Displays habit name, progress (circular or text), and a complete button.
   * Button is disabled if the habit is already completed for the selected date or if the date is not today.
   * @param item The habit object to render.
   */
  const renderHabit = ({ item }: { item: Habit }) => {
    const dateString = getIsoDateString(selectedDate);
    const todaysEntry = item.completionHistory.find(entry => entry.date === dateString);
    const currentCompletions = todaysEntry ? todaysEntry.count : 0;
    const targetCompletions = item.frequency.type === 'daily' ? (item.frequency.times || 1) : 1;
    const isFullyCompleted = currentCompletions >= targetCompletions;
    const progress = targetCompletions > 0 ? (currentCompletions / targetCompletions) * 100 : 0;
    const showCircularProgress = item.frequency.type === 'daily' && (item.frequency.times || 1) > 1;
    // Disable completion if selected date is not today OR if already fully completed for the selected date.
    const isButtonDisabled = getIsoDateString(selectedDate) !== getIsoDateString(new Date()) || isFullyCompleted;

    return (
      <View style={styles.habitCard}>
        <TouchableOpacity style={styles.habitInfoTouchable} onPress={() => router.push(`/habit/${item.id}`)}>
          <Text style={styles.habitName}>{item.name}</Text>
          {showCircularProgress ? 
            (<CircularProgress percentage={progress} radius={25} strokeWidth={5} />) : 
            (<Text style={styles.habitPercentageText}>{`${Math.round(progress)}% completed`}</Text>)} {/* Changed to Math.round for cleaner display */}
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

  // Display loading indicator while fetching initial data.
  if (isLoading) {
    return <View style={globalStyles.centeredContainer}><ActivityIndicator size="large" color={colors.accent} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {/* Header Section: Menu, Greeting, Notifications */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={onToggleDrawer} style={styles.menuButtonContainer}>
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

      {/* Horizontal Date Selector */}
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
         <TouchableOpacity onPress={() => { /* TODO: Implement navigation to a full calendar view or jump further */ }}>
             <Text style={styles.dateChevron}>{`>>`}</Text>
        </TouchableOpacity>
      </View>

      {/* Overall Daily Progress Display */}
      <View style={styles.overallProgressContainer}>
        <CircularProgress percentage={dailyProgress.percentage} radius={60} strokeWidth={10} />
        <Text style={styles.progressText}>{dailyProgress.count}/{dailyProgress.total} habits completed</Text>
      </View>

      {/* List of Habits for the Selected Date */}
      <FlatList
        data={habits.filter(habit => { // Filter habits based on selectedDate and frequency
            const dayOfWeek = selectedDate.getDay();
            if (habit.frequency.type === 'daily') return true;
            if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(dayOfWeek);
            return false;
        })}
        renderItem={renderHabit}
        keyExtractor={(item) => item.id}
        numColumns={2} // Displays habits in a 2-column grid
        columnWrapperStyle={styles.row} // Styles for each row in the grid
        ListEmptyComponent={<Text style={styles.emptyText}>No habits scheduled for {selectedDate.toDateString()}. Add one!</Text>} // Message when no habits
        contentContainerStyle={styles.listContentContainer}
      />

      {/* Floating Action Button to Add Habit */}
      <TouchableOpacity style={styles.addHabitFab} onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles.addHabitFabText}>+</Text>
      </TouchableOpacity>

      {/* Modal for Adding a New Habit */}
      <Modal visible={isAddModalVisible} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        <AddHabitScreen onAddHabit={handleAddHabit} onCancel={() => setIsAddModalVisible(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F8', 
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
    // position: 'relative', // Removed as badge is on notification icon
    padding: 10,
  },
  // Removed notificationBadge style as it was duplicated by notificationBadgeOnIcon
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
    marginHorizontal: 10, // Give some space if username is very long
    flexShrink: 1, // Allow greeting text to shrink if needed
  },
  userNameText: {
    color: colors.accent,
  },
  dateSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10, // Adjusted for better spacing with chevron
    marginBottom: 20,
  },
  dateScrollContent: {
    alignItems: 'center',
    flexGrow: 1, // Allow ScrollView to take available space before chevron
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
      paddingHorizontal: 10, // Give chevron some touchable area
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
    paddingHorizontal: 15, // Horizontal padding for the FlatList content
    paddingBottom: 80, // Add padding to the bottom to avoid FAB overlap
  },
   row: {
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  habitCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 15,
    padding: 15,
    width: '48%', 
    aspectRatio: 1, 
    justifyContent: 'space-between', 
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  habitInfoTouchable: {
      alignItems: 'center', 
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
  // Removed habitProgressCircleContainer as CircularProgress is used directly
  completeButton: {
    backgroundColor: colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    marginTop: 'auto', 
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
    elevation: 8, // For Android shadow
    shadowColor: '#000', // For iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addHabitFabText: {
    fontSize: 30,
    color: colors.primaryText,
  },
  notificationIconButton: {
    position: 'relative', // Needed for the badge positioning
    padding: 10,
  },
  notificationBellIcon: { 
    width: 24, 
    height: 24, 
    resizeMode: 'contain',
    // Consider adding tintColor if needed, e.g., tintColor: colors.textDefault
  },
  notificationBadgeOnIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: colors.error,
    borderRadius: 8, // Adjusted for a slightly smaller badge
    minWidth: 16, // Ensure badge is visible even with single digit
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1, // Ensure badge is on top
    paddingHorizontal: 4, // Give some horizontal padding for text inside badge
  },
});
