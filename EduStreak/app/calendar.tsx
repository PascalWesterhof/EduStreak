import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { useNavigation } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useLayoutEffect, useState, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../config/firebase'; // Adjust path as needed
import { useTheme } from '../functions/themeFunctions/themeContext';
import { ColorScheme } from '../functions/themeFunctions/themeContext';
import { fetchDailyQuoteFromGemini } from '../functions/ai/aiQuote';
import { fetchUserStreaksFromService } from '../functions/userService';

const getStyles = (colors: ColorScheme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.accent, // Thematische achtergrond
    padding: 16,
  },
  calendarCard: {
    backgroundColor: colors.cardBackground, // WIT wordt thematisch cardBackground
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  streakCard: {
    backgroundColor: colors.cardBackground, // WIT wordt thematisch cardBackground
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  streakItem: {
    marginBottom: 16,
  },
  streakNumber: { // Behoudt je bestaande logica (was #D1624A)
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary, // Gebruik primary uit thema (was #D1624A)
                          // of colors.accent als dat je specifieke oranje is
    marginBottom: 4,
  },
  streakLabel: { // Was #666
    fontSize: 16,
    color: colors.textMuted, // Wordt thematisch textMuted
    fontWeight: '500',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthLabel: { // Was #c44
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.calendarAccent, // Gebruik calendarAccent (was #c44)
                                // of colors.text als het algemener moet zijn
  },
  navButton: { // Was #c44
    fontSize: 20,
    color: colors.calendarAccent, // Gebruik calendarAccent (was #c44)
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekday: { // Was #c44
    flex: 1,
    textAlign: 'center',
    color: colors.calendarAccent, // Gebruik calendarAccent (was #c44)
                                // of colors.textMuted als het minder prominent moet
    fontWeight: 'bold'
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: {
    width: '14.28%',
    height: 50,
    justifyContent: 'center',
    alignItems: 'center'
  },
  date: { // Was #c44
    color: colors.calendarAccent, // Gebruik calendarAccent (was #c44)
                               // of colors.text als het algemener moet zijn
    fontWeight: '500'
  },
  dotContainer: { alignItems: 'center' },
  dotFull: { // Was #c44
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.calendarAccent, // Gebruik calendarAccent
    marginTop: 2,
  },
  dotPartial: { // Was #f88
    width: 6,
    height: 6,
    borderRadius: 3,
    // Als #f88 een specifieke betekenis heeft, houd die kleur of definieer hem in je thema.
    // Voorbeeld: je zou een 'warning' of 'partialAccent' in je ColorScheme kunnen hebben.
    // Voor nu, als het een lichtere variant van je calendarAccent moet zijn:
    backgroundColor: colors.accent, // Of een andere specifieke kleur, bijv. themeColors.error
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
  legendText: { // Was #c44
    color: colors.calendarAccent, // Gebruik calendarAccent
                                // of colors.textMuted
    marginLeft: 4,
    fontSize: 12,
  },
  quoteCard: {
    backgroundColor: colors.cardBackground, // WIT wordt thematisch cardBackground
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quoteText: { // Was #666
    fontSize: 16,
    fontStyle: 'italic',
    color: colors.textMuted, // Wordt thematisch textMuted
    textAlign: 'center',
  },
});

export default function Calendar() {
  const { colors: themeColors } = useTheme();
    const styles = useMemo(() => getStyles(themeColors), [themeColors]);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [quote, setQuote] = useState('');
    const navigation = useNavigation();

  useLayoutEffect(() => {
    let headerBackgroundColor = '#D1624A'; // Jouw vaste oranje
    let headerTextColor = themeColors.white;
    headerBackgroundColor = themeColors.accent;
    headerTextColor = themeColors.text; // tekstkleur passend bij thematische header achtergrond

    navigation.setOptions({
          headerStyle: {
            backgroundColor: headerBackgroundColor,
          },
          headerTintColor: headerTextColor,
          headerTitleStyle: {
            color: headerTextColor,
          },
          headerShadowVisible: false,
        });
      }, [navigation, themeColors]); // themeColors als dependency


  const daysInMonth = getDaysInMonth(currentDate);
  const startDay = getDay(startOfMonth(currentDate)); // 0 = Sunday
  const offset = (startDay + 6) % 7; // Adjust to start week on Monday

  const totalCells = daysInMonth + offset;
  const dates = Array.from({ length: totalCells }, (_, i) => {
    if (i < offset) return null;
    return i - offset + 1;
  });

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Listen for auth state changes and load streak data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        loadStreakData(user.uid);
      } else {
        // User is signed out, reset streak data
        setStreakData({ currentStreak: 0, longestStreak: 0 });
      }
    });

    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  useEffect(() => {
    const getQuote = async () => {
      const today = new Date().toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
      try {
        const storedQuoteData = await AsyncStorage.getItem('dailyQuote');
        if (storedQuoteData) {
          const { quote: storedQuote, date } = JSON.parse(storedQuoteData);
          if (date === today) {
            setQuote(storedQuote);
            return; // Exit if a valid quote for today is found
          }
        }

        // If no valid quote, fetch a new one
        const dailyQuote = await fetchDailyQuoteFromGemini();
        setQuote(dailyQuote);
        // Store the new quote with today's date
        await AsyncStorage.setItem('dailyQuote', JSON.stringify({ quote: dailyQuote, date: today }));
      } catch (error) {
        console.error('Failed to fetch or store daily quote:', error);
        setQuote('Could not fetch a quote for today. Stay motivated!');
      }
    };

    getQuote();
  }, []);

  const loadStreakData = async (userId: string) => {
    try {
      const data = await fetchUserStreaksFromService(userId);
      setStreakData(data);
    } catch (error) {
      console.error('Error loading streak data:', error);
      // Keep default values on error
      setStreakData({ currentStreak: 0, longestStreak: 0 });
    }
  };

  const goToPreviousMonth = () => {
    setCurrentDate(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => addMonths(prev, 1));
  };

  return (
    <View style={styles.screen}>
          <View style={styles.calendarCard}>
            <View style={styles.monthSelector}>
              <TouchableOpacity onPress={goToPreviousMonth}>
                <Text style={styles.navButton}>{'<'}</Text>
              </TouchableOpacity>
              <Text style={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
              <TouchableOpacity onPress={goToNextMonth}>
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
                      <View style={styles.dotFull} />
                    </View>
                  ) : (
                    <Text style={styles.date}></Text>
                  )}
                </View>
              ))}
            </View>

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

          {quote ? (
            <View style={styles.quoteCard}>
              <Text style={styles.quoteText}>"{quote}"</Text>
            </View>
          ) : null}
        </View>
      );
    }