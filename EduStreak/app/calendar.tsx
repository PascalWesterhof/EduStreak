import AsyncStorage from '@react-native-async-storage/async-storage';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { useNavigation } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../config/firebase'; // Adjust path as needed
import { fetchDailyQuoteFromGemini } from '../functions/ai/aiQuote';
import { fetchUserStreaksFromService } from '../functions/userService'; // Adjust path as needed

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [quote, setQuote] = useState('');
  const navigation = useNavigation();

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: {
        backgroundColor: '#D1624A',
      },
      headerTintColor: '#fff',
      headerShadowVisible: false,
    });
  }, [navigation]);

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
        {/* Month Selector */}
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={goToPreviousMonth}>
            <Text style={styles.navButton}>{'<'}</Text>
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{format(currentDate, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={goToNextMonth}>
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
                  <View style={styles.dotFull} />
                </View>
              ) : (
                <Text style={styles.date}></Text>
              )}
            </View>
          ))}
        </View>

        {/* Legend */}
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

      {/* Streak Card */}
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

      {/* Quote Card */}
      {quote ? (
        <View style={styles.quoteCard}>
          <Text style={styles.quoteText}>"{quote}"</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#D1624A',
    padding: 16,
  },
  calendarCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 4, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16, // Add spacing between cards
  },
  streakCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 4, // for Android shadow
    shadowColor: '#000', // for iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    marginBottom: 16,
  },
  streakItem: {
    marginBottom: 16,
  },
  streakNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D1624A',
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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
    color: '#c44',
  },
  navButton: {
    fontSize: 20,
    color: '#c44',
    paddingHorizontal: 12,
  },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 8 },
  weekday: { flex: 1, textAlign: 'center', color: '#c44', fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', height: 50, justifyContent: 'center', alignItems: 'center' },
  date: { color: '#c44', fontWeight: '500' },
  dotContainer: { alignItems: 'center' },
  dotFull: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#c44',
    marginTop: 2,
  },
  dotPartial: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f88',
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
    color: '#c44',
    marginLeft: 4,
    fontSize: 12,
  },
  quoteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    color: '#666',
    textAlign: 'center',
  },
});