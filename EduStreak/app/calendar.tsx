// --- Imports ---
// These lines bring in necessary code from other libraries and files.

// `AsyncStorage` is used to store small amounts of data directly on the user's device.
// We use it here to save the daily quote so we don't have to fetch it every time.
import AsyncStorage from '@react-native-async-storage/async-storage';
// `date-fns` is a powerful library for working with dates. We import specific functions.
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
// `expo-router` provides hooks for navigation, like moving between screens.
import { useNavigation } from 'expo-router';
// Firebase Authentication provides functions to manage user sign-in state.
import { onAuthStateChanged, User } from 'firebase/auth';
// `React` is the core library for building the user interface. We import its hooks.
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
// These are the visual building blocks from React Native, like Text, View, etc.
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// --- Local Project Imports ---
// These lines bring in code from other files within our own project.

// Our Firebase configuration (so we can connect to our database).
import { auth } from '../config/firebase';
// The TypeScript type definition for our color scheme.
import { ColorScheme } from '../constants/Colors';
// A function to fetch a daily quote from our AI service.
import { fetchDailyQuoteFromGemini } from '../functions/ai/aiQuote';
// A function to get all of the user's habits from the database.
import { fetchUserHabits } from '../functions/habitService';
// Our custom hook to get the current theme (light/dark mode) and its colors.
import { useTheme } from '../functions/themeFunctions/themeContext';
// A function to get the user's streak data from the database.
import { fetchUserStreaksFromService } from '../functions/userService';
// The TypeScript type definition for a Habit object.
import { Habit } from '../types';

/**
 * This function creates all the style rules for this screen.
 * It's theme-aware because it takes the `colors` object as an argument.
 * This means the screen's appearance will change with the theme (light/dark mode).
 * @param colors - An object containing all the colors for the current theme.
 * @returns A StyleSheet object containing all the styles for this component.
 */
const getStyles = (colors: ColorScheme) => StyleSheet.create({
  // Style for the main screen container, filling the whole screen.
  screen: {
    flex: 1,
    backgroundColor: colors.accent, // Uses the theme's accent color for the background.
  },
  // Style for the content inside the scrollable view, adding some padding.
  scrollContent: {
    padding: 16,
  },
  // Style for the main card that holds the calendar grid.
  calendarCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    elevation: 4, // Shadow for Android.
    shadowColor: colors.shadow, // Shadow for iOS.
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16, // Space below the card.
  },
  // Style for the card that displays the user's streaks.
  streakCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  // Style for a single streak item (e.g., "Current Streak").
  streakItem: {
    marginBottom: 16, // Space between the two streak items.
  },
  // Style for the large streak number (e.g., "10 Days").
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary, // Uses the theme's primary color.
    marginBottom: 4,
  },
  // Style for the label below the streak number (e.g., "Your current streak").
  streakLabel: {
    fontSize: 16,
    color: colors.textMuted, // A softer, less prominent text color.
    fontWeight: '500',
  },
  // Style for the header of the calendar card, containing the month and navigation arrows.
  monthSelector: {
    flexDirection: 'row', // Arranges items horizontally.
    justifyContent: 'space-between', // Puts space between the arrows and the month name.
    alignItems: 'center', // Aligns items vertically in the center.
    marginBottom: 12,
  },
  // Style for the month name text (e.g., "October 2023").
  monthLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.calendarAccent, // A specific accent color for the calendar text.
  },
  // Style for the '<' and '>' navigation buttons.
  navButton: {
    fontSize: 20,
    color: colors.calendarAccent,
    paddingHorizontal: 12,
  },
  // Style for a row of weekday names ("Mon", "Tue", etc.).
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  // Style for a single weekday name.
  weekday: {
    flex: 1, // Each weekday takes up equal space.
    textAlign: 'center',
    color: colors.calendarAccent,
    fontWeight: 'bold'
  },
  // Style for the container of the date grid.
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  // Style for a single cell in the date grid.
  cell: {
    width: '14.28%', // 100% / 7 days = ~14.28%
    height: 50, // Fixed height for each cell.
    justifyContent: 'center',
    alignItems: 'center'
  },
  // Style for the date number text inside a cell.
  date: {
    color: colors.calendarAccent,
    fontWeight: '500'
  },
  // Style for the container that holds the completion dots below the date number.
  dotContainer: { alignItems: 'center' },
  // Style for the dot indicating all habits were completed on that day.
  dotFull: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.calendarAccent,
    marginTop: 2,
  },
  // Style for the dot indicating only some habits were completed on that day.
  dotPartial: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  // Style for the legend container below the calendar grid.
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  // Style for a single item in the legend (e.g., the dot and its text).
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  // Style for the text in the legend.
  legendText: {
    color: colors.calendarAccent,
    marginLeft: 4,
    fontSize: 12,
  },
  // Style for the card that displays the daily quote.
  quoteCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // Style for the quote text itself.
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textMuted,
    textAlign: 'center',
  },
});

/**
 * `Calendar` is the main component for the calendar screen.
 * It displays a monthly calendar view showing habit completion status,
 * the user's current and longest streaks, and a daily motivational quote.
 */
export default function Calendar() {
  // --- Hooks for Theming and State Management ---
  const { colors: themeColors } = useTheme(); // Get the current theme's colors.
  const styles = useMemo(() => getStyles(themeColors), [themeColors]); // Memoize styles for performance.

  // --- State Variables ---
  // `useState` is a hook to let the component remember information.

  // This state holds the currently displayed month and year. It defaults to today.
  const [currentDate, setCurrentDate] = useState(new Date());
  // This state holds the user's streak data.
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  // This state holds the currently logged-in user's data object from Firebase.
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  // This state holds the daily motivational quote string.
  const [quote, setQuote] = useState('');
  // This state holds the full list of the user's habits.
  const [habits, setHabits] = useState<Habit[]>([]);
  // A hook to get access to navigation functions.
  const navigation = useNavigation();

  /**
   * `useLayoutEffect` is a hook similar to `useEffect`, but it runs *before* the browser
   * paints the screen. It's perfect for setting screen options like the header style,
   * so the user doesn't see a flicker of the old style before the new one is applied.
   */
  useLayoutEffect(() => {
    // Set the background and text color of the screen's header based on the current theme.
    navigation.setOptions({
          headerStyle: {
            backgroundColor: themeColors.accent,
          },
          headerTintColor: themeColors.text,
          headerTitleStyle: {
            color: themeColors.text,
          },
          headerShadowVisible: false, // Hides the shadow line under the header.
        });
      }, [navigation, themeColors]); // This effect re-runs if the navigation object or theme changes.


  // --- Calendar Grid Logic ---
  // These calculations figure out how to build the calendar grid for the `currentDate`.

  const daysInMonth = getDaysInMonth(currentDate); // How many days are in the current month? (e.g., 31)
  const startDay = getDay(startOfMonth(currentDate)); // What day of the week does the month start on? (0=Sun, 1=Mon, ...)
  const offset = (startDay + 6) % 7; // We calculate an offset to make our week start on Monday.

  // This creates an array representing all the cells in the grid, including blank ones at the start.
  const totalCells = daysInMonth + offset;
  const dates = Array.from({ length: totalCells }, (_, i) => {
    if (i < offset) return null; // If it's a blank cell before the 1st, return null.
    return i - offset + 1; // Otherwise, return the date number (1, 2, 3, ...).
  });

  // An array of weekday names for the header row.
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /**
   * This `useEffect` hook runs once when the component is first created.
   * It sets up a listener to watch for changes in the user's authentication state (login/logout).
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Store the user object.
      if (user) {
        // If a user is logged in, load their streak and habit data.
        loadStreakData(user.uid);
        loadHabitData(user.uid);
      } else {
        // If the user logs out, clear their data.
        setStreakData({ currentStreak: 0, longestStreak: 0 });
        setHabits([]);
      }
    });

    // This is a cleanup function. It runs when the component is removed
    // to stop the listener and prevent memory leaks.
    return () => unsubscribe();
  }, []); // The empty array `[]` means this effect only runs once on mount.

  /**
   * This `useEffect` hook fetches the daily motivational quote.
   * It runs once when the component is first created.
   */
  useEffect(() => {
    const getQuote = async () => {
      const today = new Date().toISOString().split('T')[0]; // Get today's date as "YYYY-MM-DD".
      try {
        // First, try to get today's quote from the device's local storage.
        const storedQuoteData = await AsyncStorage.getItem('dailyQuote');
        if (storedQuoteData) {
          const { quote: storedQuote, date } = JSON.parse(storedQuoteData);
          if (date === today) {
            // If we have a quote and it's from today, use it and stop.
            setQuote(storedQuote);
            return;
          }
        }

        // If no stored quote was found for today, fetch a new one from our AI service.
        const dailyQuote = await fetchDailyQuoteFromGemini();
        setQuote(dailyQuote);
        // Save the new quote and today's date to local storage for next time.
        await AsyncStorage.setItem('dailyQuote', JSON.stringify({ quote: dailyQuote, date: today }));
      } catch (error) {
        console.error('Failed to fetch or store daily quote:', error);
        // If anything goes wrong, show a fallback message.
        setQuote('Could not fetch a quote for today. Stay motivated!');
      }
    };

    getQuote();
  }, []); // The empty array `[]` means this effect only runs once on mount.

  /**
   * Fetches the user's habit data from the database service.
   * @param userId The unique ID of the logged-in user.
   */
  const loadHabitData = async (userId: string) => {
    try {
      const { habits: userHabits } = await fetchUserHabits(userId);
      setHabits(userHabits);
    } catch (error) {
      console.error('Error loading habit data:', error);
      setHabits([]); // Clear habits on error.
    }
  };

  /**
   * Fetches the user's streak data from the database service.
   * @param userId The unique ID of the logged-in user.
   */
  const loadStreakData = async (userId: string) => {
    try {
      const data = await fetchUserStreaksFromService(userId);
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
      // If there's an error, just keep the default streak values (0).
      setStreakData({ currentStreak: 0, longestStreak: 0 });
    }
  };

  // --- Navigation Functions ---
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1)); // Go back one month.
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1)); // Go forward one month.
  };

  /**
   * This function checks the completion status for a given date.
   * It looks at all habits scheduled for that day and sees how many were completed.
   * @param date The date to check.
   * @returns 'all' if all scheduled habits are complete,
   *          'some' if at least one but not all are complete,
   *          'none' otherwise.
   */
  const getCompletionStatusForDate = (date: Date): 'all' | 'some' | 'none' => {
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, etc.
    const dateStr = format(date, 'yyyy-MM-dd'); // Format the date to match how it's stored.

    // First, filter all habits to find only the ones scheduled for this specific day of the week.
    const scheduledHabits = habits.filter(h => {
      if (h.frequency.type === 'daily') return true;
      if (h.frequency.type === 'weekly' && Array.isArray(h.frequency.days)) {
        return h.frequency.days.includes(dayOfWeek);
      }
      return false;
    });

    // If no habits were scheduled for this day, we don't need to show a dot.
    if (scheduledHabits.length === 0) {
      return 'none';
    }

    // Next, count how many of those scheduled habits were actually completed on this date.
    const completedCount = scheduledHabits.filter(h =>
      (h.completionHistory || []).some(entry => entry.date === dateStr)
    ).length;

    // Finally, compare the counts to determine the status.
    if (completedCount === 0) {
      return 'none';
    } else if (completedCount === scheduledHabits.length) {
      return 'all'; // All scheduled habits were completed.
    } else {
      return 'some'; // Some, but not all, were completed.
    }
  };


  // --- Render Logic ---
  // This is the main JSX returned by the component, defining what the user sees.
  return (
    <View style={styles.screen}>
      {/* A `ScrollView` allows the user to scroll if the content is taller than the screen. */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* The main calendar card. */}
        <View style={styles.calendarCard}>
          {/* The month selector header. */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goToPreviousMonth}>
              <Text style={styles.navButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={goToNextMonth}>
              <Text style={styles.navButton}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* The row of weekday names. */}
          <View style={styles.row}>
            {weekdays.map(day => (
              <Text key={day} style={styles.weekday}>{day}</Text>
            ))}
          </View>

          {/* The main grid of dates. */}
          <View style={styles.grid}>
            {/* We map over our `dates` array (which includes nulls for blank cells). */}
            {dates.map((date, idx) => {
                // If the `date` is null, render an empty cell.
                if (date === null) {
                  return <View key={idx} style={styles.cell} />;
                }

                // For a real date, create a Date object and check its completion status.
                const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), date);
                const completionStatus = getCompletionStatusForDate(dayDate);

                // Render the cell with the date number and the correct completion dot.
                return (
                  <View key={idx} style={styles.cell}>
                    <View style={styles.dotContainer}>
                      <Text style={styles.date}>{date}</Text>
                      {/* Conditionally render the dots based on the status. */}
                      {completionStatus === 'all' && <View style={styles.dotFull} />}
                      {completionStatus === 'some' && <View style={styles.dotPartial} />}
                    </View>
                  </View>
                );
              })}
          </View>

          {/* The legend explaining what the dots mean. */}
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={styles.dotFull} />
              <Text style={styles.legendText}>All complete</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={styles.dotPartial} />
              <Text style={styles.legendText}>Some complete</Text>
            </View>
          </View>
        </View>

        {/* The card showing the user's streak data. */}
        <View style={styles.streakCard}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.currentStreak} Days</Text>
            <Text style={styles.streakLabel}>Your current streak</Text>
          </View>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>{streakData.longestStreak} Days</Text>
            <Text style={styles.streakLabel}>Your longest streak!</Text>
          </View>
        </View>

        {/* The card for the motivational quote. It only renders if a quote exists. */}
        {quote ? (
          <View style={styles.quoteCard}>
            <Text style={styles.quoteText}>"{quote}"</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}