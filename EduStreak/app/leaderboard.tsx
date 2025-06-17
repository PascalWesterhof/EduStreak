import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState, useMemo } from 'react'; // << Voeg useMemo toe
import { ActivityIndicator, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { auth } from '../config/firebase';
import { useTheme } from '../functions/themeFunctions/themeContext'; // << NIEUW (controleer pad)
import { ColorScheme, AppThemeColors } from '../constants/Colors';    // << NIEUW (controleer pad)
import { getGlobalStyles } from '../styles/globalStyles';           // << NIEUW (controleer pad)
import { getAllGroups, getUserGroups } from '../functions/groupService';
import {
  fetchGroupLeaderboardDataFromService,
  fetchLeaderboardDataFromService,
  LeaderboardItem,
  SortMetricType
} from '../functions/leaderboardService';

/**
 * `SORT_METRICS` defines the available options for sorting the leaderboard.
 * Each option has a human-readable label and a corresponding value used by the service.
 */
const SORT_METRICS: { label: string; value: SortMetricType }[] = [
  { label: 'Total Points', value: 'points' },
  { label: 'Current Streak', value: 'currentStreak' },
  { label: 'Longest Streak', value: 'longestStreak' },
];

const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  outerContainerCustom: {
    backgroundColor: colors.background, // << THEMA (was "#FFF")
  },
  headerContainer: {
    backgroundColor: colors.background, // << THEMA (was '#FFF')
    // Overweeg een borderBottomColor: colors.borderColor als je een scheiding wilt
  },
  headerTitleContainer: {
    flexDirection: 'row',
    marginLeft: 20,
    marginTop: -10 // Controleer of dit nog steeds goed uitlijnt met thematische header
  },
  headerTitleCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.headerText
    color: colors.textDefault, // << THEMA
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerTitleHighlight: {
    color: colors.accent, // << THEMA
  },
  sortOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.background, // << THEMA (was '#FFF')
    // Overweeg een borderBottomColor: colors.borderColor als je een scheiding wilt
  },
  sortOptionTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.mutedText
    marginHorizontal: 5,
    paddingVertical: 5,
    fontSize: 14,
    // Kleur komt van appGlobalStyles.mutedText, wat colors.textMuted gebruikt
  },
  sortOptionTextActive: {
    color: colors.accent, // << THEMA
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: colors.accent, // << THEMA
  },
  sortSeparator: {
    fontSize: 14,
    color: colors.textMuted, // << THEMA (was colors.mediumGray, gebruik thematische muted)
    marginHorizontal: 3,
  },
  errorTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.errorText
    marginTop: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
    // Kleur komt van appGlobalStyles.errorText, wat colors.error gebruikt
  },
  emptyTextCustom: { // Wordt gebruikt SAMEN MET appGlobalStyles.bodyText
    color: colors.textMuted, // << THEMA
    textAlign: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardBackground, // << THEMA
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderColor, // << THEMA
    shadowColor: colors.shadow, // << THEMA (was colors.black)
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08, // Dit kan je eventueel thematisch maken als je wilt
    shadowRadius: 3,
    elevation: 2, // Android shadow
  },
  topUserItemContainer: {
    // backgroundColor: colors.accentMuted, // Je had dit teruggezet naar cardBackground
    borderColor: colors.accent, // << THEMA
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
    backgroundColor: colors.inputBackground, // << THEMA (was colors.lightGray, inputBackground is een goede thematische optie)
  },
  rankCircleTop: {
    backgroundColor: colors.accent, // << THEMA
  },
  rankText: {
    fontSize: 14,
    color: colors.textDefault, // << THEMA
    fontWeight: 'bold',
  },
  rankTextTop: {
    color: colors.primaryText, // << THEMA (ervan uitgaande dat accent een donkere achtergrond is, anders textDefault)
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.inputBackground, // << THEMA (was colors.lightGray)
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textMuted, // << THEMA (was colors.mediumGray)
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarPlaceholderText: {
    color: colors.background, // << THEMA (als placeholder achtergrond donker is, anders primaryText of textDefault)
    fontSize: 18,
    fontWeight: 'bold',
  },
  nameText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDefault, // << THEMA
  },
  separator: {
    height: '60%',
    width: 1,
    backgroundColor: colors.borderColor, // << THEMA
    marginHorizontal: 10,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent, // << THEMA
    minWidth: 40,
    textAlign: 'right',
  },
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.background, // << THEMA (was '#FFF')
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor, // << THEMA
  },
  tabButton: {
    paddingBottom: 5,
  },
  tabText: {
    paddingHorizontal: 5,
    fontSize: 16,
    color: colors.textMuted, // << THEMA
  },
  tabTextActive: {
    color: colors.accent, // << THEMA
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: colors.accent, // << THEMA
  },
});

/**
 * `Leaderboard` component displays a ranked list of users based on selectable metrics
 * (points, current streak, longest streak). It fetches data from `leaderboardService`
 * and handles loading and error states.
 */
export default function Leaderboard() {
  const navigation = useNavigation();
  const { colors: themeColors, isDark } = useTheme(); // << NIEUW: Haal theme kleuren en isDark op
  const appGlobalStyles = useMemo(() => getGlobalStyles(themeColors), [themeColors]); // << NIEUW
  const screenStyles = useMemo(() => getScreenStyles(themeColors, appGlobalStyles), [themeColors, appGlobalStyles]); // << NIEUW


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
       const rankCircleStyle = isTopThree ? screenStyles.rankCircleTop : screenStyles.rankCircleDefault;
       const rankTextStyle = isTopThree ? screenStyles.rankTextTop : screenStyles.rankText;

    // Determine the score to display based on the active sortMetric
    let scoreValue: number;
    switch (sortMetric) {
        case 'points': scoreValue = item.points; break;
        case 'currentStreak': scoreValue = item.currentStreak; break;
        case 'longestStreak': scoreValue = item.longestStreak; break;
        default: scoreValue = 0; // Should not happen with defined SortMetricType
    }

    return (
      // Gebruik screenStyles
           <View style={[screenStyles.itemContainer, isTopUser && screenStyles.topUserItemContainer]}>
             <View style={[screenStyles.rankCircle, rankCircleStyle]}>
               <Text style={rankTextStyle}>{item.rank}</Text>
             </View>
             {item.photoURL ? (
               <Image source={{ uri: item.photoURL }} style={screenStyles.avatar} />
             ) : (
               <View style={screenStyles.avatarPlaceholder}>
                 <Text style={screenStyles.avatarPlaceholderText}>
                   {item.displayName ? item.displayName.charAt(0).toUpperCase() : 'U'}
                 </Text>
               </View>
             )}
             <Text style={screenStyles.nameText} numberOfLines={1} ellipsizeMode="tail">{item.displayName}</Text>
             <View style={screenStyles.separator} />
             <Text style={screenStyles.scoreText}>{scoreValue}</Text>
           </View>
         );
       };

  return (
    // Gebruik appGlobalStyles en screenStyles
        <View style={[appGlobalStyles.screenContainer, screenStyles.outerContainerCustom]}>
          <StatusBar barStyle={isDark ? "light-content" : "dark-content"} /> {/* << THEMA StatusBar */}

          <View style={screenStyles.headerContainer}>
            <View style={screenStyles.headerTitleContainer}>
              <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Group </Text>
              <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom, screenStyles.headerTitleHighlight]}>Leaderboard</Text>
            </View>
          </View>

          <View style={screenStyles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity onPress={() => setActiveTab('global')} style={screenStyles.tabButton}>
                <Text style={[screenStyles.tabText, activeTab === 'global' && screenStyles.tabTextActive]}>
                  Global
                </Text>
              </TouchableOpacity>
              {userGroups.map((group) => (
                <TouchableOpacity key={group.id} onPress={() => setActiveTab(group.id)} style={screenStyles.tabButton}>
                  <Text style={[screenStyles.tabText, activeTab === group.id && screenStyles.tabTextActive]}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={screenStyles.sortOptionsContainer}>
            {SORT_METRICS.map((option, index) => (
              <React.Fragment key={option.value}>
                <TouchableOpacity onPress={() => setSortMetric(option.value)}>
                  <Text style={[
                    appGlobalStyles.mutedText, // Globale stijl voor gedempt tekst
                    screenStyles.sortOptionTextCustom, // Scherm-specifieke tweaks
                    sortMetric === option.value && screenStyles.sortOptionTextActive // Actieve stijl
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
                {index < SORT_METRICS.length - 1 && <Text style={screenStyles.sortSeparator}> | </Text>}
              </React.Fragment>
            ))}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={themeColors.accent} style={appGlobalStyles.centeredContainer} />
          ) : error ? (
            <Text style={[appGlobalStyles.errorText, screenStyles.errorTextCustom]}>{error}</Text>
          ) : leaderboardData.length === 0 ? (
            <Text style={[appGlobalStyles.bodyText, screenStyles.emptyTextCustom]}>
              {"The leaderboard is currently empty or no users match the criteria. Keep up the good work!"}
            </Text>
          ) : (
            <FlatList
              data={leaderboardData}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={screenStyles.listContentContainer}
            />
          )}
        </View>
      );
    }