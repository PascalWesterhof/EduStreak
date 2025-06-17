import { DrawerActions, useFocusEffect } from "@react-navigation/native";
import { useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth'; // Import onAuthStateChanged and User type
import { doc, increment, updateDoc } from 'firebase/firestore'; // Firestore functions
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import 'react-native-get-random-values'; // For uuid
import { CircularProgress } from '../components/CircularProgress'; // Restored import
import { auth, db } from '../config/firebase'; // Import db and auth
import { ColorScheme } from "../constants/Colors";
import {
  addNewHabit as addNewHabitService,
  completeHabitLogic as completeHabitService,
  fetchUserHabits,
  updateDailyStreakLogic as updateDailyStreakService
} from '../functions/habitService'; // Import the service
import { useTheme } from '../functions/themeFunctions/themeContext'; // Pas het pad aan naar jouw bestand
import { checkAndResetDailyStreak } from '../functions/userService';
import { getGlobalStyles } from '../styles/globalStyles'; // << NIEUW: importeer de functie
import { Habit } from '../types'; // Path for types
import { getIsoDateString } from '../utils/dateUtils'; // Added import
import AddHabitScreen from './habit/AddHabitScreen';

// This checks if the app is running on a web browser.
// The app's layout or behavior might be slightly different on the web vs. a mobile phone.
const isWeb = Platform.OS === 'web';

/**
 * This is an array holding the three-letter abbreviations for the days of the week.
 * It's used to display the day in the date selector UI.
 * The order is important: it starts with Sunday at index 0, Monday at 1, and so on.
 */
const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// This is a function that creates all the style rules for this screen.
// It takes a `colors` object as an argument, which contains all the colors for the current theme (like light or dark mode).
// This makes the app's appearance change based on the selected theme.
const getStyles = (colors: ColorScheme) => {
      return StyleSheet.create({
      // Style for the main container that holds the entire screen.
      container: {
        flex: 1, // This makes the container take up all available screen space.
        // This adds some space at the top on Android to avoid overlapping with the status bar.
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
      },
      // Style for the container that holds the "Hello, User!" greeting.
      headerContainer: {
        flexDirection: 'row', // Arranges items horizontally.
        marginLeft: 20, // Adds space on the left side.
        marginBottom: 10, // Adds space below the container.
      },
      // Style for the "Hello, " part of the greeting text.
      greetingText: {
        fontSize: 28, // Sets the font size.
        fontWeight: 'bold', // Makes the text bold.
        textAlign: 'center', // Centers the text.
        flexShrink: 1, // Allows the text to shrink if there isn't enough space.
      },
      // Style for the user's name in the greeting.
      userNameText: {
        // This style is intentionally left empty.
        // It's used as a placeholder to apply specific colors to the username text later.
      },
      // Style for the container of the horizontal date selector.
      dateSelectorContainer: {
        flexDirection: 'row', // Arranges the dates and arrows horizontally.
        alignItems: 'center', // Aligns items vertically in the center.
        paddingHorizontal: 10, // Adds space on the left and right.
        marginBottom: 20, // Adds space below the date selector.
      },
      // Style for the scrollable area within the date selector.
      dateScrollContent: {
        alignItems: 'center', // Aligns the date items to the center.
        flexGrow: 1, // Allows the content to grow and take up available space.
      },
      // Style for a single date item in the selector.
      dateItem: {
        alignItems: 'center', // Centers the day and number text.
        paddingVertical: 10, // Adds space above and below the text.
        paddingHorizontal: 12, // Adds space to the left and right of the text.
        marginHorizontal: 4, // Adds space between each date item.
        borderRadius: 10, // Rounds the corners of the date item.
      },
      // Style for the currently selected date item.
      selectedDateItem: {
        // This is a placeholder style. The background color is applied directly where it's used.
      },
      // Style for the day text (e.g., "Mon").
      dateDayText: {
        fontSize: 12,
      },
      // Style for the date number (e.g., "15").
      dateNumberText: {
        fontSize: 18,
        fontWeight: 'bold',
      },
      // Style for the text inside a selected date item.
      selectedDateText: {
        // This is a placeholder style. The color is applied directly where it's used.
      },
      // Style for the '>>' arrow that opens the full calendar.
      dateChevron: {
          fontSize: 20,
          paddingHorizontal: 10,
      },
      // Style for the container holding the circular progress bar.
      overallProgressContainer: {
        alignItems: 'center', // Centers the progress bar and text.
        marginBottom: 20, // Adds space below the container.
        paddingHorizontal: 20, // Adds space on the sides.
      },
      // Style for the text below the progress bar (e.g., "2/5 habits completed").
      progressText: {
        fontSize: 16,
        marginTop: 10, // Adds space above the text.
        fontWeight: 'bold',
      },
      // Style for the container of the habit list (the FlatList).
      listContentContainer: {
        paddingHorizontal: 15, // Adds space on the sides of the list.
        paddingBottom: 80, // Adds space at the bottom to avoid being hidden by the add button.
      },
      // Additional styles for the habit list when on a web browser.
      webListContentContainer: {
        width: '80%', // Makes the list narrower on wide screens.
        alignSelf: 'center', // Centers the list horizontally.
        flexDirection: 'row', // Arranges habit cards in a row.
        flexWrap: 'wrap', // Allows cards to wrap to the next line if they don't fit.
        justifyContent: 'center', // Centers the cards in the container.
      },
      // Style for a row in the two-column grid layout on mobile.
       row: {
        justifyContent: 'space-between', // Puts equal space between the two habit cards in a row.
        marginBottom: 15, // Adds space below each row.
      },
      // Style for a single habit card.
      habitCard: {
        borderRadius: 15, // Rounds the corners.
        padding: 15, // Adds space inside the card.
        width: '48%', // Each card takes up slightly less than half the screen width.
        aspectRatio: 1, // Makes the card a perfect square.
        justifyContent: 'space-between', // Distributes content vertically.
        alignItems: 'center', // Centers content horizontally.
        // The following styles add a subtle shadow effect.
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3, // This is the shadow for Android.
      },
      // Extra style for habit cards on the web to give them a fixed width.
      webHabitCard: {
        width: 250,
        margin: 10, // Adds space around each card.
      },
      // Style for the touchable area inside the habit card.
      habitInfoTouchable: {
          alignItems: 'center',
          width: '100%',
      },
      // Style for the container of the habit name and checkmark.
      habitNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
      },
      // Style for the habit name text.
      habitName: {
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
      },
      // Style for the checkmark that appears when a habit is completed.
      checkmarkText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 5,
      },
      // Style for the "COMPLETE" button on a habit card.
      completeButton: {
        paddingVertical: 8, // Vertical padding.
        paddingHorizontal: 15, // Horizontal padding.
        borderRadius: 20, // Rounds the button corners.
        width: '80%', // Button width is 80% of the card's width.
        alignItems: 'center', // Centers the text inside.
        marginTop: 'auto', // Pushes the button to the bottom of the card.
      },
      // Style for the button when the habit is already completed.
      completedButton: {
        // This is a placeholder style. The background color is applied directly.
      },
      // Style for the text inside the "COMPLETE" button.
      completeButtonText: {
        fontSize: 12,
        fontWeight: 'bold',
      },
      // Style for the text that shows when there are no habits for the selected day.
      emptyText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
      },
      // Style for the floating action button (the '+' button) to add a new habit.
      addHabitFab: {
        position: 'absolute', // Allows placing it anywhere on the screen.
        right: 20, // 20 pixels from the right edge.
        bottom: 20, // 20 pixels from the bottom edge.
        width: 56,
        height: 56,
        borderRadius: 28, // Makes it a perfect circle.
        backgroundColor: colors.accent, // Uses the theme's accent color.
        justifyContent: 'center', // Centers the '+' vertically.
        alignItems: 'center', // Centers the '+' horizontally.
        elevation: 8, // Adds a shadow for Android.
        // The following styles add a shadow for iOS.
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      // Style for the '+' text inside the floating action button.
      addHabitFabText: {
        fontSize: 30,
        color: colors.primaryText, // Uses the theme's primary text color (usually white or black).
      },
    });
};

/**
 * `Index` is the main component for the home screen of the application.
 * It's a "functional component" in React, which is the modern way to write components.
 * This screen is responsible for showing the user their habits for a selected day,
 * their overall daily progress, and allowing them to add or complete habits.
 */
export default function Index() {
  // --- Hooks for Navigation and Theming ---
  
  // `useNavigation` is a hook from React Navigation that gives us access to navigation actions, like opening the drawer.
  const appNavigation = useNavigation();
  // `useRouter` is a hook from Expo Router that lets us navigate to different screens.
  const router = useRouter();
  // `useTheme` is our custom hook to get the current theme's colors and mode (light or dark).
  const { colors: themeColors, themeMode } = useTheme();
  // `useMemo` is a React hook that optimizes performance. It only recalculates the styles when the theme colors change.
  const styles = useMemo(() => getStyles(themeColors), [themeColors]);
  // This gets our global styles (like for centered containers) and makes them theme-aware.
  const globalStyles = useMemo(() => getGlobalStyles(themeColors), [themeColors]);

  // --- State Management ---
  // "State" is how a React component remembers information. We use the `useState` hook for this.

  // This state holds the list of the user's habits. It starts as an empty array [].
  const [habits, setHabits] = useState<Habit[]>([]);
  // This state is a boolean (true/false) that controls whether the "Add Habit" modal is visible.
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  // This state tracks whether the screen is currently loading data. It shows a spinner if true.
  const [isLoading, setIsLoading] = useState(true);
  // This state stores the unique ID of the currently logged-in user. It starts as `null`.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // This state keeps track of the date the user has selected in the horizontal date picker. It defaults to today.
  const [selectedDate, setSelectedDate] = useState(new Date()); 
  // This state holds the display name of the user. It defaults to "User".
  const [userName, setUserName] = useState("User");

  /**
   * `useFocusEffect` is a hook from React Navigation. The code inside it runs every time the user navigates to this screen.
   * It's useful for fetching fresh data or resetting state when the screen becomes active.
   * `useCallback` is used for optimization, ensuring the function isn't recreated on every render.
   */
  useFocusEffect(
    useCallback(() => {
      // Create a `Date` object for the current moment.
      const today = new Date();
      // Convert it to a standardized string format like "2023-10-27".
      const todayIso = getIsoDateString(today);
      
      // This checks if the `selectedDate` is not today. If the user comes back to the screen
      // on a new day, we want to reset the view to show today's habits.
      if (getIsoDateString(selectedDate) !== todayIso) {
        console.log(`[IndexScreen] Focus: selectedDate (${getIsoDateString(selectedDate)}) is not today. Resetting to today (${todayIso}).`);
        setSelectedDate(today); // Reset the selected date to the current day.
      }

      setIsLoading(true); // Start showing the loading spinner.
      console.log("[IndexScreen] Focus effect triggered.");

      // This sets up a listener for authentication state changes from Firebase.
      // It automatically runs whenever a user signs in or out.
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        // If `user` object exists, it means someone is signed in.
        if (user) {
          console.log("[IndexScreen] Auth: User signed in - ID:", user.uid);
          // Store the user's unique ID and display name in our state.
          setCurrentUserId(user.uid);
          setUserName(user.displayName || "User");
          
          // This function checks if the user's daily streak needs to be reset (e.g., if they missed a day).
          checkAndResetDailyStreak(user.uid);
          
          // `try...catch` is used for error handling. We `try` to fetch data,
          // and if an error occurs, we `catch` it and handle it gracefully.
          try {
            // Fetch all habits for the logged-in user from our database service.
            const { habits: fetchedHabits } = await fetchUserHabits(user.uid);
            // Update our component's state with the habits we just fetched.
            setHabits(fetchedHabits);
            console.log("[IndexScreen] Data fetched and set successfully.");
          } catch (error) {
            console.error("[IndexScreen] Error loading data: ", error);
            setHabits([]); // If there's an error, clear the habits list.
          } finally {
            // The `finally` block runs whether the `try` was successful or not.
            setIsLoading(false); // Stop showing the loading spinner.
          }
        } else {
          // If `user` is null, no one is signed in.
          console.log("[IndexScreen] Auth: No user found. Redirecting to login.");
          // Redirect the user to the login screen. `replace` prevents them from going back to this screen.
          router.replace('/auth/LoginScreen');
        }
      });

      // This is a "cleanup" function. It runs when the user navigates away from this screen.
      // It's crucial for unsubscribing from listeners to prevent memory leaks.
      return () => {
        console.log("[IndexScreen] Cleanup: Auth listener.");
        unsubscribe(); // Stop listening to auth changes.
      };
    }, [router]) // This array lists dependencies. The effect re-runs if any of these change.
  );

  /**
   * This function is called when the user taps the menu icon.
   * It opens the navigation drawer from the side of the screen.
   */
  const onToggleDrawer = () => {
      appNavigation.dispatch(DrawerActions.openDrawer());
  };

  /**
   * This function handles the logic for adding a new habit.
   * It's passed as a prop to the `AddHabitScreen` modal.
   * @param newHabitData - An object containing the details of the new habit from the form.
   */
  const handleAddHabit = async (newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt'>) => {
    // A check to make sure a user is logged in before trying to add a habit.
    if (!currentUserId) {
      alert("You must be logged in to add habits. Please sign in.");
      return; // Stop the function here.
    }
    try {
      // Call the service function that contains the logic to save the habit to the Firestore database.
      const newHabitFromService = await addNewHabitService(currentUserId, newHabitData);
      console.log("[IndexScreen] Habit added via service. ID:", newHabitFromService.id);
      // Add the newly created habit to our local state to instantly update the UI.
      // `...prevHabits` is a "spread" operator that copies all existing habits.
      setHabits(prevHabits => [...prevHabits, newHabitFromService]); 
      // Close the "Add Habit" modal.
      setIsAddModalVisible(false);
    } catch (error) {
      console.error("[IndexScreen] Error in handleAddHabit: ", error);
      alert("Failed to save habit. Please try again.");
    }
  };

  /**
   * This function handles the logic when a user taps the "COMPLETE" button on a habit.
   * It updates the habit's completion status in the database and in the local state.
   * @param habitId - The unique ID of the habit to be completed.
   */
  const handleCompleteHabit = async (habitId: string) => {
    // A check to make sure a user is logged in.
    if (!currentUserId) { 
      alert("You must be logged in to complete habits."); 
      return; 
    }

    // Get the currently selected date as a standardized string.
    const selectedDateStr = getIsoDateString(selectedDate);

    try {
      // Call the service function that handles the complex logic of completing a habit.
      // This function returns the updated habit and a flag indicating if it was the first completion for that day.
      const { updatedHabit, wasCompletedToday } = await completeHabitService(
        currentUserId,
        habitId,
        selectedDateStr,
        habits 
      );

      // If the habit was successfully completed for the first time today and we got an updated habit object...
      if (wasCompletedToday && updatedHabit) {
        // We update the local `habits` state to reflect the change immediately in the UI.
        // `map` creates a new array. It goes through each habit `h` and if its ID matches the one we updated,
        // it replaces it with `updatedHabit`. Otherwise, it keeps the old habit `h`.
        const newHabitsState = habits.map(h => (h.id === updatedHabit.id ? updatedHabit : h));
        setHabits(newHabitsState);
        console.log(`[IndexScreen] Habit ${habitId} state updated locally after completion.`);

        // --- Award points for completion ---
        // Get a reference to the user's document in the 'users' collection in Firestore.
        const userDocRef = doc(db, "users", currentUserId);
        try {
          // Update the user's document, incrementing their 'points' field by 10.
          await updateDoc(userDocRef, { points: increment(10) });
          console.log(`[IndexScreen] User ${currentUserId} awarded 10 points for completing habit ${habitId} on ${selectedDateStr}`);
        } catch (error) { console.error("[IndexScreen] Error awarding points: ", error); }
        
        // --- Check if this completion affects the user's daily streak ---
        // We only update the daily streak if the habit was completed for the *current* day.
        if (getIsoDateString(selectedDate) === getIsoDateString(new Date())) {
          await checkAndUpdateDailyStreak(newHabitsState); 
        }
      } else if (updatedHabit && !wasCompletedToday) {
        // This case handles if the user tries to complete an already completed habit.
        console.log(`[IndexScreen] Habit ${habitId} was already completed for ${selectedDateStr}.`);
      } else if (!updatedHabit) {
        // A warning for an unexpected situation where the service didn't return a habit.
        console.warn("[IndexScreen] updatedHabit was undefined after completeHabitService call, unexpected issue.")
      }
    } catch (error) {
      console.error("[IndexScreen] Error in handleCompleteHabit: ", error);
      alert("Failed to update habit completion. Please try again.");
    }
  };

  /**
   * This function checks if all habits for today are completed and updates the user's daily streak accordingly.
   * @param habitsForStreakCheck - The current array of user's habits.
   */
  const checkAndUpdateDailyStreak = async (habitsForStreakCheck: Habit[]) => {
    if (!currentUserId) {
        console.log("[IndexScreen] No user ID, cannot update daily streak.");
        return;
    }
    try {
        console.log("[IndexScreen] Calling daily streak update service.");
        // Call the service function that contains the logic for streak calculation.
        await updateDailyStreakService(currentUserId, habitsForStreakCheck);
    } catch (error) {
        // The service should ideally handle its own errors, but we log any that bubble up.
        console.error("[IndexScreen] Error from updateDailyStreakService (service should handle internal errors):", error);
    }
  };

  /**
   * `useMemo` is a performance optimization. This code block calculates the date range
   * for the horizontal selector. It will only re-run if `selectedDate` changes.
   * This prevents unnecessary recalculations on every render.
   */
  const dateRange = useMemo(() => {
    const range = [];
    // This loop creates an array of 5 dates: 2 before the selected date, the selected date, and 2 after.
    for (let i = -2; i <= 2; i++) { 
      const date = new Date(selectedDate);
      date.setDate(selectedDate.getDate() + i);
      range.push(date);
    }
    return range;
  }, [selectedDate]); // Dependency array: this code re-runs only when `selectedDate` changes.

  /**
   * This function is called when a user taps on a date in the horizontal selector.
   * It updates the `selectedDate` state to the new date.
   * @param date - The `Date` object that the user selected.
   */
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  /**
   * This `useMemo` hook calculates the user's daily progress percentage.
   * It's memoized, so it only recalculates when the list of `habits` or the `selectedDate` changes.
   * This is more efficient than recalculating on every single re-render.
   * @returns An object with `count` (completed), `total` (scheduled), and `percentage`.
   */
  const dailyProgress = useMemo(() => {
    // Get the selected date as a string and the day of the week as a number (0=Sun, 6=Sat).
    const dateString = getIsoDateString(selectedDate);
    const dayOfWeek = selectedDate.getDay();

    // Filter the master list of habits to only include those scheduled for the selected day.
    const habitsScheduledForDay = habits.filter(habit => {
      if (habit.frequency.type === 'daily') return true; // Daily habits are always scheduled.
      // For weekly habits, check if the selected day is in the habit's list of scheduled days.
      if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(dayOfWeek);
      return false;
    });

    // If no habits are scheduled for this day, return zero for all values.
    if (habitsScheduledForDay.length === 0) return { count: 0, total: 0, percentage: 0 };

    // Count how many of the scheduled habits have been completed on the selected date.
    const completedCount = habitsScheduledForDay.filter(habit => {
      // Find an entry in the habit's completion history that matches the selected date.
      const entry = habit.completionHistory.find(e => e.date === dateString);
      return !!entry; // `!!entry` converts the result (an object or undefined) to a boolean (true or false).
    }).length;
    
    // Return the final calculated progress values.
    return {
        count: completedCount,
        total: habitsScheduledForDay.length,
        // Calculate the percentage. Avoid division by zero if there are no habits.
        percentage: habitsScheduledForDay.length > 0 ? (completedCount / habitsScheduledForDay.length) * 100 : 0
    };
  }, [habits, selectedDate]); // Dependency array: recalculates only when habits or selectedDate change.

  /**
   * This function defines how to render a single habit card in the list.
   * The `FlatList` component will call this function for each item in its `data` array.
   * @param item - An object containing the data for one habit. `item` is destructured from the props.
   */
  const renderHabit = ({ item }: { item: Habit }) => {
    const dateString = getIsoDateString(selectedDate);
    // Find if there's a completion record for this habit on the selected date.
    const todaysEntry = item.completionHistory.find(entry => entry.date === dateString);
    
    // `isFullyCompleted` will be `true` if `todaysEntry` was found, `false` otherwise.
    const isFullyCompleted = !!todaysEntry;
        
    // The "COMPLETE" button should be disabled if the selected date is not today, or if the habit is already done.
    const isButtonDisabled = getIsoDateString(selectedDate) !== getIsoDateString(new Date()) || isFullyCompleted;

    // This is the JSX that defines the visual structure of a single habit card.
    return (
      // The main container for the card. It applies several styles.
      // `isWeb && styles.webHabitCard` means the `webHabitCard` style is only applied on the web.
      <View style={[styles.habitCard, { backgroundColor: themeColors.cardBackground, shadowColor: themeColors.shadow || '#000' }, isWeb && styles.webHabitCard]}>
        {/* This makes the top part of the card (name and checkmark) tappable to navigate to habit details. */}
        <TouchableOpacity onPress={() => router.push(`/habit/${item.id}`)}>
          <View>
            <Text style={[styles.habitName, { color: themeColors.text }]}>{item.name}</Text>
            {/* The checkmark is only rendered if the habit is fully completed. */}
            {isFullyCompleted && <Text style={[styles.checkmarkText, { color: themeColors.accent }]}> ✓</Text>}
          </View>
        </TouchableOpacity>
        {/* This is the "COMPLETE" button. */}
        <TouchableOpacity
          onPress={() => handleCompleteHabit(item.id)} // Calls our complete function when pressed.
          disabled={isButtonDisabled} // Disables the button based on our logic.
          style={[
            styles.completeButton,
            { backgroundColor: themeColors.accent }, // Default style.
            // If the button is disabled, apply a different style to make it look grayed out.
            isButtonDisabled ? [styles.completedButton, { backgroundColor: themeColors.textMuted }] : {}
          ]}
        >
          {/* The text inside the button changes based on completion status. */}
          <Text style={[styles.completeButtonText, { color: themeColors.primaryText }]}>{isFullyCompleted ? "COMPLETED" : "COMPLETE"}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // --- Render Logic ---

  // While data is being fetched from the database, display a loading spinner.
  // This prevents the user from seeing an empty screen.
  if (isLoading) {
    return <View style={globalStyles.centeredContainer}><ActivityIndicator size="large" color={themeColors.accent} /></View>;
  }

  // This is the main JSX returned by the component, defining what the user sees.
  return (
    // The main view container, using themed styles.
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {/* The StatusBar component controls the appearance of the system status bar (time, battery, etc.). */}
      <StatusBar
        barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={themeColors.headerBackground}
      />
      {/* The header section with the greeting. */}
      <View style={styles.headerContainer}>
        <Text style={[styles.greetingText, { color: themeColors.text }]}>Hello, <Text style={[styles.userNameText, { color: themeColors.accent }]}>{userName}!</Text></Text>
      </View>


      {/* This is the horizontal date selector component. */}
      <View style={styles.dateSelectorContainer}>
        {/* `ScrollView` with `horizontal` prop allows users to swipe left and right. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScrollContent}>
          {/* We `map` over our `dateRange` array to create a tappable button for each date. */}
          {dateRange.map((date, index) => {
            // Check if the current date in the loop is the one that's selected.
            const isSelected = date.toDateString() === selectedDate.toDateString();
            return (
              <TouchableOpacity
                key={index} // `key` is a required, unique identifier for each item in a list.
                onPress={() => handleDateSelect(date)} // When tapped, it updates the selected date.
                style={[
                  styles.dateItem,
                  { backgroundColor: themeColors.cardBackground },
                  // If `isSelected` is true, it also applies the selected item style.
                  isSelected && [styles.selectedDateItem, { backgroundColor: themeColors.accent }]
                ]}
              >
                <Text style={[styles.dateDayText, { color: themeColors.textMuted }, isSelected && { color: themeColors.primaryText }]}>{days[date.getDay()]}</Text>
                <Text style={[styles.dateNumberText, { color: themeColors.text }, isSelected && { color: themeColors.primaryText }]}>{date.getDate()}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        {/* This is the button that navigates to the full calendar screen. */}
        <TouchableOpacity onPress={() => router.push(`/calendar`)}>
          <Text style={[styles.dateChevron, { color: themeColors.textMuted }]}>{`>>`}</Text>
        </TouchableOpacity>
      </View>

      {/* This section displays the overall daily progress. */}
       <View style={styles.overallProgressContainer}>
         {/* This is the custom circular progress bar component. */}
         <CircularProgress
           percentage={dailyProgress.percentage}
           radius={60}
           strokeWidth={10}
           color={themeColors.accent}
           backgroundColor={themeColors.textMuted}
         />
         {/* This text shows the numerical progress. */}
         <Text style={[styles.progressText, { color: themeColors.accent }]}>{dailyProgress.count}/{dailyProgress.total} habits completed</Text>
       </View>

      {/* This is the list of habits. `FlatList` is an efficient way to display long, scrollable lists. */}
      <FlatList
        // The `data` prop receives the array of habits to display. We filter them here first.
        data={habits.filter(habit => {
            const dayOfWeek = selectedDate.getDay();
            if (habit.frequency.type === 'daily') return true;
            if (habit.frequency.type === 'weekly') return habit.frequency.days?.includes(dayOfWeek);
            return false;
        })}
        renderItem={renderHabit} // Tells the list how to render each single item, using our function from above.
        keyExtractor={(item) => item.id} // Provides a unique key for each item.
        // On mobile (`!isWeb`), display the list in a 2-column grid.
        {...(!isWeb && { numColumns: 2, columnWrapperStyle: styles.row })}
        // A component to show when the list is empty.
        ListEmptyComponent={<Text style={styles.emptyText}>No habits scheduled for {selectedDate.toDateString()}. Add one!</Text>}
        // Applies different container styles for web and mobile.
        contentContainerStyle={isWeb ? [styles.listContentContainer, styles.webListContentContainer] : styles.listContentContainer}
      />

      {/* This is the floating action button ('+') for adding a new habit. */}
      <TouchableOpacity style={styles.addHabitFab} onPress={() => setIsAddModalVisible(true)}>
        <Text style={styles.addHabitFabText}>+</Text>
      </TouchableOpacity>

      {/* This is the Modal for adding a new habit. It's hidden by default. */}
      {/* It becomes visible when `isAddModalVisible` is true. */}
      <Modal visible={isAddModalVisible} animationType="slide" onRequestClose={() => setIsAddModalVisible(false)}>
        {/* The content of the modal is the AddHabitScreen component. */}
        <AddHabitScreen onAddHabit={handleAddHabit} onCancel={() => setIsAddModalVisible(false)} />
      </Modal>
    </View>
  );
}
