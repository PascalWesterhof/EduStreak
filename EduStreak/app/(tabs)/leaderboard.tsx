import { DrawerActions, useNavigation } from '@react-navigation/native';
import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth, db } from '../../config/firebase';
import { colors } from '../../constants/Colors';
import { globalStyles } from '../../styles/globalStyles';

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
    const isTopUser = item.rank === 1;
    const isTopThree = item.rank !== undefined && item.rank <= 3;
    const rankCircleStyle = isTopThree ? styles.rankCircleTop : styles.rankCircleDefault;
    const rankTextStyle = isTopThree ? styles.rankTextTop : styles.rankText;
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
          <Text style={rankTextStyle}>{item.rank}</Text>
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
    <View style={[globalStyles.screenContainer, styles.outerContainerCustom]}>
      <StatusBar barStyle="dark-content" />
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.dispatch(DrawerActions.openDrawer())} style={styles.menuButton}>
          <Image source={require('../../assets/icons/burger_menu_icon.png')} style={styles.menuIcon} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Group </Text>
          <Text style={[globalStyles.headerText, styles.headerTitleCustom, styles.headerTitleHighlight]}>Leaderboard</Text>
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortOptionsContainer}>
        {SORT_METRICS.map((option, index) => (
          <React.Fragment key={option.value}>
            <TouchableOpacity onPress={() => setSortMetric(option.value)}>
              <Text style={[globalStyles.mutedText, styles.sortOptionTextCustom, sortMetric === option.value && styles.sortOptionTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
            {index < SORT_METRICS.length - 1 && <Text style={styles.sortSeparator}> | </Text>}
          </React.Fragment>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={globalStyles.centeredContainer} />
      ) : error ? (
        <Text style={[globalStyles.errorText, styles.errorTextCustom]}>{error}</Text>
      ) : leaderboardData.length === 0 ? (
        <Text style={[globalStyles.bodyText, styles.emptyTextCustom]}>
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
  outerContainerCustom: {
    backgroundColor: colors.lightGray,
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
    tintColor: colors.textDefault,
  },
  headerTitleContainer: {
    flexDirection: 'row',
  },
  headerTitleCustom: {
    color: colors.textDefault,
  },
  headerTitleHighlight: {
    color: colors.accent,
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sortOptionTextCustom: {
    marginHorizontal: 5,
  },
  sortOptionTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  sortSeparator: {
    fontSize: 14,
    color: colors.mediumGray,
  },
  errorTextCustom: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  emptyTextCustom: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingHorizontal: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  topUserItemContainer: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.accent,
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankCircleDefault: {
    backgroundColor: colors.borderColor,
  },
  rankCircleTop: {
    backgroundColor: colors.accent,
  },
  rankText: {
    fontSize: 14,
    color: colors.textDefault,
    fontWeight: 'bold',
  },
  rankTextTop: {
    color: colors.primaryText,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDefault,
    marginLeft: 12,
  },
  separator: {
    height: '60%',
    width: 1,
    backgroundColor: colors.lightGray,
    marginHorizontal: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
  },
});
