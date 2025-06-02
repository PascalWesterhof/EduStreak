import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import fallbackQuotes from '../../assets/data/fallback_quotes.json'; // Import fallback quotes
import { auth, db } from '../../config/firebase';
import { colors } from '../../constants/Colors'; // Import global colors
import { globalStyles } from '../../styles/globalStyles'; // Import global styles

// Interface for the ZenQuotes API response item
interface ZenQuoteResponse {
  q: string; // Quote text
  a: string; // Author
  h: string; // Pre-formatted HTML quote (we'll use q and a)
}

export default function Calendar() {
  const navigation = useNavigation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [isLoadingStreaks, setIsLoadingStreaks] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(auth.currentUser);

  // State for motivational quote
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [isQuoteLoading, setIsQuoteLoading] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const fetchUserStreaks = useCallback(async (user: User | null) => {
    if (!user) {
      console.log("[CalendarScreen] fetchUserStreaks called with no user. Resetting streaks.");
      setCurrentStreak(0);
      setLongestStreak(0);
      setIsLoadingStreaks(false);
      return;
    }

    console.log("[CalendarScreen] fetchUserStreaks called for user:", user.uid);
    setIsLoadingStreaks(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const fetchedCurrentStreak = userData.currentStreak || 0;
        const fetchedLongestStreak = userData.longestStreak || 0;
        setCurrentStreak(fetchedCurrentStreak);
        setLongestStreak(fetchedLongestStreak);
        console.log("[CalendarScreen] User streaks fetched: Current =", fetchedCurrentStreak, "Longest =", fetchedLongestStreak);
      } else {
        console.log("[CalendarScreen] User document not found. Streaks set to 0.");
        setCurrentStreak(0);
        setLongestStreak(0);
      }
    } catch (error) {
      console.error("[CalendarScreen] Error fetching user streaks:", error);
      setCurrentStreak(0);
      setLongestStreak(0);
    } finally {
      setIsLoadingStreaks(false);
      console.log("[CalendarScreen] Finished fetching user streaks.");
    }
  }, [db]);

  // Function to fetch daily quote from ZenQuotes
  const fetchDailyQuote = async () => {
    setIsQuoteLoading(true);
    setQuoteError(null);
    try {
      // Using ZenQuotes API for a random quote
      const response = await fetch('https://zenquotes.io/api/random');
      if (!response.ok) {
        // Try to get error message from API response if available
        let errorText = `HTTP error! status: ${response.status}`;
        try {
            const errorData = await response.json();
            if (errorData && typeof errorData.error === 'string') {
                errorText = errorData.error;
            } else if (response.statusText) {
                errorText = response.statusText;
            }
        } catch (e) { /* Ignore if parsing error data fails */ }
        throw new Error(errorText);
      }
      const dataArray: ZenQuoteResponse[] = await response.json();
      if (dataArray && dataArray.length > 0) {
        setQuoteText(dataArray[0].q);
        setQuoteAuthor(dataArray[0].a);
      } else {
        // API success but no data, use fallback
        console.warn("[CalendarScreen] ZenQuotes API returned no quotes. Using fallback.");
        setFallbackQuote("API returned empty or invalid data.");
      }
    } catch (err: any) {
      console.error("[CalendarScreen] Error fetching quote from ZenQuotes:", err);
      setFallbackQuote(err.message); // Pass error message for specific error in setFallbackQuote
    } finally {
      setIsQuoteLoading(false);
    }
  };

  // Function to set a fallback quote
  const setFallbackQuote = (apiErrorMessage?: string) => {
    const randomIndex = Math.floor(Math.random() * fallbackQuotes.length);
    const randomFallbackQuote = fallbackQuotes[randomIndex];
    setQuoteText(randomFallbackQuote.q);
    setQuoteAuthor(randomFallbackQuote.a);

    let errorMessage = "Failed to load live quote. Showing a classic instead.";
    if (apiErrorMessage) {
        if (apiErrorMessage.toLowerCase().includes('rate limit') || apiErrorMessage.toLowerCase().includes('too many requests')) {
            errorMessage = "Quote API limit reached. Here's a classic for now!";
        } else if (apiErrorMessage.toLowerCase().includes('network request failed')) {
            errorMessage = "Network error. Displaying a timeless quote.";
        } else {
            // Keep a generic message for other errors, or could log apiErrorMessage for debugging
        }
    }
    setQuoteError(errorMessage);
  };

  useEffect(() => {
    fetchDailyQuote(); // Fetch quote on component mount

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        console.log("[CalendarScreen] Auth state changed, user present. Fetching user streaks.");
        fetchUserStreaks(user);
      } else {
        console.log("[CalendarScreen] Auth state changed, no user. Resetting streaks.");
        setCurrentStreak(0);
        setLongestStreak(0);
        setIsLoadingStreaks(false);
      }
    });
    return unsubscribe;
  }, [fetchUserStreaks]);

  useFocusEffect(
    useCallback(() => {
      console.log("[CalendarScreen] Screen focused.");
      if (currentUser) {
        console.log("[CalendarScreen] User found on focus, fetching user streaks.");
        fetchUserStreaks(currentUser);
      } else {
        console.log("[CalendarScreen] No user found on focus. Streaks will not be fetched or will be reset by fetchUserStreaks.");
        fetchUserStreaks(null);
      }
      return () => {
        console.log("[CalendarScreen] Screen blurred or unmounted.");
      };
    }, [currentUser, fetchUserStreaks])
  );

  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getDay(startOfMonth(currentDate)); // 0 = Sunday
  const offset = (startDay + 6) % 7; // Adjust to start week on Monday

  const totalCells = daysInMonth + offset;
  const dates = Array.from({ length: totalCells }, (_, i) => {
    if (i < offset) return null;
    return i - offset + 1;
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  }
  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  return (
    <View style={globalStyles.screenContainer}>
      <StatusBar barStyle="light-content" />
      {/* Custom Header */}
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
        <View style={[globalStyles.card, styles.calendarCard]}>
          {/* Month Selector */}
          <View style={styles.monthSelector}>
            <TouchableOpacity onPress={goToPreviousMonth} disabled={isLoadingStreaks}>
              <Text style={styles.navButton}>{'<'}</Text>
            </TouchableOpacity>
            <Text style={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
            <TouchableOpacity onPress={goToNextMonth} disabled={isLoadingStreaks}>
              <Text style={styles.navButton}>{'>'}</Text>
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.row}>
            {weekdays.map(day => (
              <Text key={day} style={styles.weekday}>{day}</Text>
            ))}
          </View>

          {/* Dates Grid */}
          <View style={styles.grid}>
            {dates.map((date, idx) => (
              <View key={idx} style={styles.cell}>
                {date ? (
                  <View style={styles.dotContainer}>
                    <Text style={styles.date}>{date}</Text>
                    {/* Placeholder for actual dot logic */}
                    {/* <View style={styles.dotFull} /> */}
                  </View>
                ) : (
                  <Text style={styles.date}></Text>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Streaks Card */}
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

        {/* Motivational Quote Card */}
        <View style={[globalStyles.card, styles.quoteCard]}>
          <Text style={[globalStyles.titleText, styles.quoteCardTitle]}>Daily Motivation</Text>
          {isQuoteLoading ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : quoteError ? (
            <Text style={globalStyles.errorText}>{quoteError}</Text>
          ) : (
            <>
              <Text style={[globalStyles.bodyText, styles.quoteText]}>"{quoteText}"</Text>
              <Text style={[globalStyles.mutedText, styles.quoteAuthor]}>- {quoteAuthor}</Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://zenquotes.io/')} style={styles.attributionContainer}>
                <Text style={[globalStyles.mutedText, styles.attributionText]}>Quotes from ZenQuotes.io</Text>
              </TouchableOpacity>
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
    width: 24 + 10,
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
  cell: { width: '14.28%', height: 50, justifyContent: 'center', alignItems: 'center' },
  date: { color: colors.calendarAccent, fontWeight: '500' },
  dotContainer: { alignItems: 'center' }, 
  dotFull: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.calendarAccent,
    marginTop: 2,
  },
  dotPartial: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  legendText: {
    color: colors.calendarAccent,
    marginLeft: 4,
    fontSize: 12,
  },
  streaksCard: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    minHeight: 100,
    justifyContent: 'center',
  },
  streakItemContainer: {
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  streakValueText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.accent,
    marginBottom: 2,
  },
  streakLabelText: {
    color: colors.textSecondary,
  },
  quoteCard: {
    marginTop: 20,
    marginBottom: 20,
  },
  quoteCardTitle: {
    textAlign: 'center',
  },
  quoteText: {
    fontStyle: 'italic',
    color: colors.darkGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  quoteAuthor: {
    textAlign: 'right',
  },
  attributionContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  attributionText: {
    textDecorationLine: 'underline',
  },
});
