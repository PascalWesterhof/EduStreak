import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../config/firebase';
import { colors } from '../constants/Colors';
import { getAllGroups, getUserGroups } from '../functions/groupService';
import {
  fetchGroupLeaderboardDataFromService,
  fetchLeaderboardDataFromService,
  LeaderboardItem,
  SortMetricType
} from '../functions/leaderboardService';
import { globalStyles } from '../styles/globalStyles';

/**
 * `SORT_METRICS` defines the available options for sorting the leaderboard.
 * Each option has a human-readable label and a corresponding value used by the service.
 */
const SORT_METRICS: { label: string; value: SortMetricType }[] = [
  { label: 'Total Points', value: 'points' },
  { label: 'Current Streak', value: 'currentStreak' },
  { label: 'Longest Streak', value: 'longestStreak' },
];

/**
 * `Leaderboard` component displays a ranked list of users based on selectable metrics
 * (points, current streak, longest streak). It fetches data from `leaderboardService`
 * and handles loading and error states.
 */
export default function Leaderboard() {
  const navigation = useNavigation();

  // State for leaderboard data, loading status, selected sort metric, errors, and current user ID
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortMetric, setSortMetric] = useState<SortMetricType>('points'); // Default sort metric
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // For potential future use (e.g., highlighting current user)
  const [userGroups, setUserGroups] = useState<{ id: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<string>('global'); // 'global' or a groupId

  /**
   * `useEffect` hook to set up an authentication listener.
   * Updates `currentUserId` when auth state changes.
   * Currently, `currentUserId` is not directly used to alter the leaderboard query but is available for future enhancements.
   */
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setLeaderboardData([]); // Clear data if user logs out
      }
    });
    return unsubscribe; // Cleanup listener on unmount
  }, []);

  const fetchUserGroups = useCallback(async () => {
    if (currentUserId) {
      try {
        const groupIds = await getUserGroups(currentUserId);
        if (groupIds.length > 0) {
          const allGroups = await getAllGroups();
          const myGroups = allGroups.filter((g) => groupIds.includes(g.id));
          setUserGroups(myGroups.map((g: any) => ({ id: g.id, name: g.name })));
        } else {
          setUserGroups([]);
        }
      } catch (error) {
        console.error("Failed to fetch user groups for leaderboard tabs:", error);
        setUserGroups([]);
      }
    } else {
      setUserGroups([]);
    }
  }, [currentUserId]);

  /**
   * `useEffect` hook to fetch the user's groups to display as tabs.
   * Runs when the current user's ID is set or when the screen is focused.
   */
  useEffect(() => {
    fetchUserGroups(); // Initial fetch
    const unsubscribe = navigation.addListener('focus', fetchUserGroups);
    return unsubscribe; // Cleanup listener
  }, [navigation, fetchUserGroups]);

  /**
   * `fetchLeaderboardData` is a memoized function to fetch and update the leaderboard.
   * It calls `fetchLeaderboardDataFromService` with the current `sortMetric`.
   * Manages loading and error states.
   */
  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log(`[LeaderboardScreen] Fetching for tab: ${activeTab}, sorting by:`, sortMetric);
    try {
      const rankedUsers =
        activeTab === 'global'
          ? await fetchLeaderboardDataFromService(sortMetric)
          : await fetchGroupLeaderboardDataFromService(activeTab, sortMetric);

      setLeaderboardData(rankedUsers);
      console.log("[LeaderboardScreen] Leaderboard data received from service and set in state.");

    } catch (err: any) {
      console.error("[LeaderboardScreen] Error after calling leaderboard service:", err);
      setError(err.message || 'Failed to load leaderboard. Please try again.');
      setLeaderboardData([]); // Clear data on error
    } finally {
      setIsLoading(false);
    }
  }, [sortMetric, activeTab]); // Dependency: re-fetches if sortMetric or activeTab changes

  /**
   * `useEffect` hook to trigger `fetchLeaderboardData` when the component mounts
   * or when `fetchLeaderboardData` (due to `sortMetric` change) is updated.
   */
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  /**
   * Renders a single item in the leaderboard FlatList.
   * Displays user's rank, avatar (or placeholder), display name, and score based on the current `sortMetric`.
   * Special styling is applied for top-ranked users.
   * @param item The `LeaderboardItem` object to render.
   */
  const renderItem = ({ item }: { item: LeaderboardItem }) => {
    const isTopUser = item.rank === 1;
    const isTopThree = item.rank !== undefined && item.rank <= 3;
    const rankCircleStyle = isTopThree ? styles.rankCircleTop : styles.rankCircleDefault;
    const rankTextStyle = isTopThree ? styles.rankTextTop : styles.rankText;
    
    // Determine the score to display based on the active sortMetric
    let scoreValue: number;
    switch (sortMetric) {
        case 'points': scoreValue = item.points; break;
        case 'currentStreak': scoreValue = item.currentStreak; break;
        case 'longestStreak': scoreValue = item.longestStreak; break;
        default: scoreValue = 0; // Should not happen with defined SortMetricType
    }

    return (
      <View style={[styles.itemContainer, isTopUser && styles.topUserItemContainer]}>
        <View style={[styles.rankCircle, rankCircleStyle]}>
          <Text style={rankTextStyle}>{item.rank}</Text>
        </View>
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
        ) : (
          // Placeholder avatar with the first letter of the display name
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarPlaceholderText}>
              {item.displayName ? item.displayName.charAt(0).toUpperCase() : 'U'} {/* Default to 'U' for User */}
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
      {/* Custom Header: Menu button and Title */}
      <View style={styles.headerContainer}>
        <View style={styles.headerTitleContainer}>
          <Text style={[globalStyles.headerText, styles.headerTitleCustom]}>Group </Text>
          <Text style={[globalStyles.headerText, styles.headerTitleCustom, styles.headerTitleHighlight]}>Leaderboard</Text>
        </View>
      </View>

      {/* Leaderboard Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity onPress={() => setActiveTab('global')} style={styles.tabButton}>
            <Text style={[styles.tabText, activeTab === 'global' && styles.tabTextActive]}>
              Global
            </Text>
          </TouchableOpacity>
          {userGroups.map((group) => (
            <TouchableOpacity key={group.id} onPress={() => setActiveTab(group.id)} style={styles.tabButton}>
              <Text style={[styles.tabText, activeTab === group.id && styles.tabTextActive]}>
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Sort Metric Selection Tabs */}
      <View style={styles.sortOptionsContainer}>
        {SORT_METRICS.map((option, index) => (
          <React.Fragment key={option.value}>
            <TouchableOpacity onPress={() => setSortMetric(option.value)}>
              <Text style={[
                globalStyles.mutedText, 
                styles.sortOptionTextCustom, 
                sortMetric === option.value && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
            {index < SORT_METRICS.length - 1 && <Text style={styles.sortSeparator}> | </Text>}
          </React.Fragment>
        ))}
      </View>

      {/* Main Content: Loading Indicator, Error Message, or Leaderboard List */}
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={globalStyles.centeredContainer} />
      ) : error ? (
        <Text style={[globalStyles.errorText, styles.errorTextCustom]}>{error}</Text>
      ) : leaderboardData.length === 0 ? (
        <Text style={[globalStyles.bodyText, styles.emptyTextCustom]}>
          {"The leaderboard is currently empty or no users match the criteria. Keep up the good work!"}
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
    backgroundColor: "#FFF", // Consistent background
  },
  headerContainer: {
    backgroundColor: '#FFF',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    marginLeft: 20,
    marginTop: -10
  },
  headerTitleCustom: {
    color: colors.textDefault,
    fontSize: 28, // Ensure headerText from globalStyles is applied or define size here
    fontWeight: 'bold', // Make title bold
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
    backgroundColor: '#FFF', // Give sort options a subtle background
  },
  sortOptionTextCustom: {
    marginHorizontal: 5,
    paddingVertical: 5, // Add some padding for better touch area
    fontSize: 14, // Standardize font size
  },
  sortOptionTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
    borderBottomWidth: 2, // Highlight active sort option
    borderBottomColor: colors.accent,
  },
  sortSeparator: {
    fontSize: 14,
    color: colors.mediumGray,
    marginHorizontal: 3, // Reduce space around separator
  },
  errorTextCustom: {
    marginTop: 20,
    paddingHorizontal: 20,
    textAlign: 'center', // Center error text
  },
  emptyTextCustom: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15, // Add padding at the bottom of the list
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground,
    paddingVertical: 12, // Increased padding for better spacing
    paddingHorizontal: 10,
    marginVertical: 6,
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
    backgroundColor: colors.cardBackground, // Reverted from accentMuted
    borderColor: colors.accent, // Keep accent border for highlighting
  },
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15, // Perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankCircleDefault: {
    backgroundColor: colors.lightGray, // Softer background for default rank
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
    color: colors.primaryText, // White text on accent background
  },
  avatar: {
    width: 40, // Slightly larger avatar
    height: 40,
    borderRadius: 20, // Perfect circle
    marginRight: 10,
    backgroundColor: colors.lightGray, // Placeholder background for image loading
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10, // Consistent margin
  },
  avatarPlaceholderText: {
    color: colors.primaryText,
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameText: {
    flex: 1, // Allow name to take available space
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDefault,
  },
  separator: {
    height: '60%', // Vertical separator line
    width: 1,
    backgroundColor: colors.borderColor, // Use border color for separator
    marginHorizontal: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    minWidth: 40, // Ensure score has some minimum width for alignment
    textAlign: 'right', // Align score to the right
  },
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  tabButton: {
    paddingBottom: 5,
  },
  tabText: {
    paddingHorizontal: 5,
    fontSize: 16,
    color: colors.textMuted,
  },
  tabTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
});