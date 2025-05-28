import { DrawerActions, useNavigation } from '@react-navigation/native';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from '../../config/firebase';

// Define a type for our leaderboard item
interface LeaderboardItem {
  id: string;
  displayName: string;
  points: number;
  currentStreak: number;
  longestStreak: number;
  rank?: number; // Optional rank, to be added after sorting
  photoURL?: string; // Optional: if you store user photo URLs
}

type SortMetricType = 'points' | 'currentStreak' | 'longestStreak';

const SORT_METRICS: { label: string; value: SortMetricType }[] = [
  { label: 'Total Points', value: 'points' },
  { label: 'Current Streak', value: 'currentStreak' },
  { label: 'Longest Streak', value: 'longestStreak' },
];

export default function Leaderboard() {
  const navigation = useNavigation();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortMetric, setSortMetric] = useState<SortMetricType>('points');
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setLeaderboardData([]); // Clear data if user logs out
      }
    });
    return unsubscribe;
  }, []);

  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const usersCollectionRef = collection(db, 'users');
      let finalQuery;

      finalQuery = query(usersCollectionRef, orderBy(sortMetric, 'desc'), limit(50));

      if (!finalQuery) { // Should not happen if logic is correct
          setIsLoading(false);
          return;
      }

      const querySnapshot = await getDocs(finalQuery);
      const users: LeaderboardItem[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          displayName: data.displayName || 'Anonymous',
          points: data.points || 0,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          photoURL: data.photoURL,
        });
      });

      const rankedUsers = users.map((user, index) => ({ ...user, rank: index + 1 }));
      setLeaderboardData(rankedUsers);

    } catch (err: any) {
      console.error("Error fetching leaderboard data: ", err);
      setError('Failed to load leaderboard. Please try again.');
      setLeaderboardData([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [sortMetric, currentUserId]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]); // fetchLeaderboardData is memoized with all its dependencies

  const renderItem = ({ item }: { item: LeaderboardItem }) => {
    const isTopUser = item.rank === 1; // Highlight only for global top user
    const rankCircleStyle = item.rank && item.rank <= 3 ? styles.rankCircleTop : styles.rankCircleDefault;
    // Determine score based on sortMetric
    let scoreValue: number;
    switch (sortMetric) {
        case 'points': scoreValue = item.points; break;
        case 'currentStreak': scoreValue = item.currentStreak; break;
        case 'longestStreak': scoreValue = item.longestStreak; break;
        default: scoreValue = 0;
    }

    return (
      <View style={[styles.itemContainer, isTopUser && styles.topUserItemContainer]}>
        <View style={[styles.rankCircle, rankCircleStyle]}>
          <Text style={styles.rankText}>{item.rank}</Text>
        </View>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {item.displayName ? item.displayName.charAt(0).toUpperCase() : 'A'}
            </Text>
          </View>
        )}
        <Text style={styles.nameText} numberOfLines={1} ellipsizeMode="tail">{item.displayName}</Text>
        <View style={styles.separator} />
        <Text style={styles.scoreText}>{scoreValue}</Text>
      </View>
    );
  };

  return (
    <View style={styles.outerContainer}>
      <StatusBar barStyle="dark-content" />
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Group </Text>
          <Text style={[styles.headerTitle, styles.headerTitleHighlight]}>Leaderboard</Text>
        </View>
      </View>

      {/* Sort Options RESTORED */}
      <View style={styles.sortOptionsContainer}>
        {SORT_METRICS.map((option, index) => (
          <React.Fragment key={option.value}>
            <TouchableOpacity onPress={() => setSortMetric(option.value)}>
              <Text style={[styles.sortOptionText, sortMetric === option.value && styles.sortOptionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
            {index < SORT_METRICS.length - 1 && <Text style={styles.sortSeparator}> | </Text>}
          </React.Fragment>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color="#d05b52" style={styles.loader} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : leaderboardData.length === 0 ? (
        <Text style={styles.emptyText}>
          {"Leaderboard is empty or no users match the criteria."}
        </Text>
      ) : (
        <FlatList
          data={leaderboardData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContentContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F4F6F8', // Light greyish background, similar to image
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  menuButton: {
    padding: 5,
    marginRight: 10,
  },
  menuIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
    tintColor: '#2c3e50', // Darker icon for light background
  },
  headerTitleContainer: {
    flexDirection: 'row',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50', // Dark grey
  },
  headerTitleHighlight: {
    color: '#d05b52', // Theme color
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10, // Reduced padding a bit
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sortOptionText: {
    fontSize: 14,
    color: '#7f8c8d', // Muted grey
    marginHorizontal: 5,
  },
  sortOptionTextActive: {
    color: '#d05b52', // Theme color
    fontWeight: 'bold',
  },
  sortSeparator: {
    fontSize: 14,
    color: '#bdc3c7', // Lighter grey for separator
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  emptyText: {
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingHorizontal: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent', // Default no border
  },
  topUserItemContainer: {
    borderColor: '#d05b52', // Theme color border for top user
    borderWidth: 2,
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankCircleTop: {
    backgroundColor: '#d05b52', // Theme color for top 3
  },
  rankCircleDefault: {
    backgroundColor: '#e0e0e0', // Light grey for others
  },
  rankText: {
    fontSize: 14,
    color: '#FFFFFF', // White text for rank on colored circle
    fontWeight: 'bold',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#f0f0f0', // Placeholder background
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#cccccc', // A slightly darker grey for placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
    flex: 1, // Take remaining space
    marginRight: 10,
  },
  separator: {
    width: 1,
    height: '60%', // Vertical line height
    backgroundColor: '#e0e0e0', // Light grey separator
    marginHorizontal: 10,
  },
  scoreText: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: 'bold',
    minWidth: 50, // Ensure some space for score
    textAlign: 'right',
  },
});
