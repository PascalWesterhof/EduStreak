import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { User, onAuthStateChanged } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { fetchUserStreaksFromService } from '../../services/userService';
import { globalStyles } from '../../styles/globalStyles';

/**
 * `Calendar` component displays a monthly calendar view, the user's current and longest habit streaks,
 * and a daily motivational quote. It allows navigation between months.
 * User-specific data (streaks) is fetched based on authentication state.
 * Quotes are fetched from an external API with a fallback mechanism.
 */
export default function Calendar() {
  const navigation = useNavigation();

  // State for current date in calendar, user streaks, loading states, and current user
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoadingStreaks, setIsLoadingStreaks] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  /**
   * Fetches user's current and longest streaks from `userService`.
   * Sets loading state and updates streak states upon successful fetch or error.
   * @param user The Firebase User object. If null, streaks are reset to 0.
   */
  const fetchUserStreaks = useCallback(async (user: User | null) => {
    if (!user) {
      setCurrentStreak(0);
      setLongestStreak(0);
      setIsLoadingStreaks(false);
      return;
    }
    setIsLoadingStreaks(true);
    try {
      const { currentStreak: fetchedCurrentStreak, longestStreak: fetchedLongestStreak } = await fetchUserStreaksFromService(user.uid);
      setCurrentStreak(fetchedCurrentStreak);
      setLongestStreak(fetchedLongestStreak);
    } catch (error) {
      console.error("[CalendarScreen] Error in fetchUserStreaks calling userService:", error);
      setCurrentStreak(0); // Default to 0 on error
      setLongestStreak(0);
    } finally {
      setIsLoadingStreaks(false);
    }
  }, []);

  /**
   * `useEffect` hook to fetch initial data (quote) and set up an authentication state listener.
   * When auth state changes, it updates `currentUser` and fetches user streaks.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        fetchUserStreaks(user);
      } else {
        // Reset streaks if user signs out
        setCurrentStreak(0);
        setLongestStreak(0);
        setIsLoadingStreaks(false);
      }
    });
    return unsubscribe; // Cleanup listener on unmount
  }, [fetchUserStreaks]); // `fetchUserStreaks` is memoized, so this runs mainly on mount/unmount

  /**
   * `useFocusEffect` hook to re-fetch user streaks when the screen comes into focus.
   * This ensures data is up-to-date if changes occurred on other screens.
   */
  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchUserStreaks(currentUser);
      } else {
        // If no user is logged in when screen focuses, ensure streaks are cleared.
        fetchUserStreaks(null);
      }
    }, [currentUser, fetchUserStreaks])
  );

  // Calculate days for the current month's calendar grid
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDayOfMonth = startOfMonth(currentDate);
  const startDayOfWeek = getDay(firstDayOfMonth); // 0 (Sun) to 6 (Sat)
  // Adjust offset for weeks starting on Monday (0 = Mon, ..., 6 = Sun)
  const offset = (startDayOfWeek === 0) ? 6 : startDayOfWeek - 1; 

  const totalCells = daysInMonth + offset;
  const dates = Array.from({ length: totalCells }, (_, i) => {
    if (i < offset) return null; // Empty cells before the first day of the month
    return i - offset + 1;    // Day number
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  /**
   * Navigates the calendar to the previous month.
   */
  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  }
  /**
   * Navigates the calendar to the next month.
   */
  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  return (
    <View style={globalStyles.screenContainer}>
      <StatusBar barStyle="light-content" />
      {/* Custom Header: Menu button, Title, Placeholder */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Calendar</Text>
        </View>
        <View style={styles.headerRightPlaceholder} /> 
      </View>
      <ScrollView style={globalStyles.scrollViewContainer}>
      <View style={[globalStyles.contentContainer, styles.screenContentPadding]}>
        {/* Calendar Card: Month Selector, Weekday Headers, Dates Grid */}
        <View style={[globalStyles.card, styles.calendarCard]}>
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goToPreviousMonth} disabled={isLoadingStreaks}>
              <Text style={styles.navButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={goToNextMonth} disabled={isLoadingStreaks}>
              <Text style={styles.navButton}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            {weekdays.map(day => (
              <Text key={day} style={styles.weekday}>{day}</Text>
            ))}
          </View>

          <View style={styles.grid}>
            {dates.map((date, idx) => (
              <View key={idx} style={styles.cell}>
                {date ? (
                  <View style={styles.dotContainer}>
                    <Text style={styles.date}>{date}</Text>
                  </View>
                ) : (
                  <Text style={styles.date}></Text> // Empty cell filler
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Streaks Display Card */}
        <View style={[globalStyles.card, styles.streaksCard]}>
          {isLoadingStreaks ? (
            <ActivityIndicator size="large" color={colors.accent} />
          ) : (
            <>
              <View style={styles.streakItemContainer}>
                <Text style={styles.streakValueText}>{currentStreak} Days</Text>
                <Text style={[globalStyles.bodyText, styles.streakLabelText]}>Your current streak</Text>
              </View>
              <View style={styles.streakItemContainer}>
                <Text style={styles.streakValueText}>{longestStreak} Days</Text>
                <Text style={[globalStyles.bodyText, styles.streakLabelText]}>Your longest streak!</Text>
              </View>
            </>
          )}
        </View>

      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContentPadding: {
      padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: colors.primaryText,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryText,
  },
  headerRightPlaceholder: {
    width: 24 + 10, // Matches menuButton padding + icon width for balance
  },
  calendarCard: {
    marginBottom: 16,
    padding: 16,
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.calendarAccent,
  },
  navButton: {
    fontSize: 20,
    color: colors.calendarAccent,
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', color: colors.calendarAccent, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 50, justifyContent: 'center', alignItems: 'center' }, // 100/7 for 7 days a week
  date: { color: colors.calendarAccent, fontWeight: '500' },
  dotContainer: { alignItems: 'center' }, 
  dotFull: { // Style for a fully completed day dot (example)
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.calendarAccent, // Or a specific success color
    marginTop: 2,
  },
  dotPartial: { // Style for a partially completed day dot (example)
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent, // Or a specific partial color
    marginTop: 2,
  },
  
  streaksCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  streakItemContainer: {
    alignItems: 'flex-start', // Aligns text to the left
    marginBottom: 15,
  },
  streakValueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 2,
  },
  streakLabelText: {
    color: colors.textSecondary, // Use a secondary text color for labels
  },
});
