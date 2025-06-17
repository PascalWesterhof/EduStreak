// These are 'imports'. They bring in code from other files and libraries
// so we can use their features in this file.

// This gives us access to navigation features, like moving between screens.
import { useNavigation } from '@react-navigation/native';
// This is the main library for creating user interfaces with React.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
// These are the building blocks for our user interface from React Native.
import { ActivityIndicator, FlatList, Image, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

// This imports our Firebase authentication configuration, so we know who is logged in.
import { auth } from '../config/firebase';
// This imports our TypeScript type definition for a color scheme, ensuring we use colors correctly.
import { ColorScheme } from '../constants/Colors';
// These are functions to get data about groups from our database.
import { getAllGroups, getUserGroups } from '../functions/groupService';
// These are functions and type definitions specifically for fetching and handling leaderboard data.
import {
  fetchGroupLeaderboardDataFromService,
  fetchLeaderboardDataFromService,
  LeaderboardItem,
  SortMetricType
} from '../functions/leaderboardService';
// This imports our custom hook for accessing theme information (like dark or light mode).
import { useTheme } from '../functions/themeFunctions/themeContext';
// This imports a function to get global, reusable styles that are also theme-aware.
import { getGlobalStyles } from '../styles/globalStyles';

/**
 * `SORT_METRICS` is a constant configuration array. It's not a state because it never changes.
 * It defines the different ways the user can sort the leaderboard.
 * Each object in the array has:
 * - `label`: The text the user sees on the button (e.g., "Total Points").
 * - `value`: The internal key used by our code to fetch the correctly sorted data (e.g., "points").
 */
const SORT_METRICS: { label: string; value: SortMetricType }[] = [
  { label: 'Total Points', value: 'points' },
  { label: 'Current Streak', value: 'currentStreak' },
  { label: 'Longest Streak', value: 'longestStreak' },
];

// This is a function that creates all the specific style rules for the Leaderboard screen.
// It takes the current theme's `colors` object as an argument, so all styles are theme-aware.
const getScreenStyles = (colors: ColorScheme, appGlobalStyles: any) => StyleSheet.create({
  // A custom style for the outermost container to apply the theme's background color.
  outerContainerCustom: {
    backgroundColor: colors.background,
  },
  // Style for the header area at the top of the screen.
  headerContainer: {
    backgroundColor: colors.background,
  },
  // Style to position the title within the header.
  headerTitleContainer: {
    flexDirection: 'row', // Arranges "Group" and "Leaderboard" text side-by-side.
    marginLeft: 20,
    marginTop: -10,
  },
  // Custom styles for the header title text.
  headerTitleCustom: {
    color: colors.textDefault,
    fontSize: 28,
    fontWeight: 'bold',
  },
  // Style for the highlighted part of the title ("Leaderboard").
  headerTitleHighlight: {
    color: colors.accent, // Uses the theme's accent color.
  },
  // Style for the container that holds the sort option buttons.
  sortOptionsContainer: {
    flexDirection: 'row', // Arranges sort options horizontally.
    justifyContent: 'center', // Centers the options horizontally.
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 10,
    backgroundColor: colors.background,
  },
  // Style for the text of a sort option.
  sortOptionTextCustom: {
    marginHorizontal: 5,
    paddingVertical: 5,
    fontSize: 14,
  },
  // Style for the currently active sort option, making it stand out.
  sortOptionTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
    borderBottomWidth: 2, // Adds an underline.
    borderBottomColor: colors.accent,
  },
  // Style for the "|" separator between sort options.
  sortSeparator: {
    fontSize: 14,
    color: colors.textMuted,
    marginHorizontal: 3,
  },
  // Custom style for displaying an error message.
  errorTextCustom: {
    marginTop: 20,
    paddingHorizontal: 20,
    textAlign: 'center',
  },
  // Custom style for the message shown when the leaderboard is empty.
  emptyTextCustom: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  // Style for the padding of the list container.
  listContentContainer: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  // Style for a single user row in the leaderboard list.
  itemContainer: {
    flexDirection: 'row', // Arranges items (rank, avatar, name, score) horizontally.
    alignItems: 'center', // Aligns them vertically.
    backgroundColor: colors.cardBackground, // Uses the theme's card color.
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderColor,
    shadowColor: colors.shadow, // Adds a shadow.
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2, // Shadow for Android.
  },
  // A special style to highlight the top-ranked user.
  topUserItemContainer: {
    borderColor: colors.accent, // Gives the #1 user an accent-colored border.
  },
  // Style for the circle that displays the user's rank number.
  rankCircle: {
    width: 30,
    height: 30,
    borderRadius: 15, // Makes it a perfect circle.
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  // The default background color for the rank circle.
  rankCircleDefault: {
    backgroundColor: colors.inputBackground,
  },
  // The background color for the rank circle of top-ranked users.
  rankCircleTop: {
    backgroundColor: colors.accent,
  },
  // The default text color for the rank number.
  rankText: {
    fontSize: 14,
    color: colors.textDefault,
    fontWeight: 'bold',
  },
  // The text color for the rank number of top-ranked users.
  rankTextTop: {
    color: colors.primaryText,
  },
  // Style for the user's avatar image.
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: colors.inputBackground,
  },
  // Style for the placeholder shown if a user doesn't have an avatar.
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  // Style for the initial (e.g., "J" for "John") in the placeholder.
  avatarPlaceholderText: {
    color: colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Style for the user's display name.
  nameText: {
    flex: 1, // Allows the name to take up the remaining horizontal space.
    fontSize: 16,
    fontWeight: '500',
    color: colors.textDefault,
  },
  // Style for the vertical line separating the name from the score.
  separator: {
    height: '60%',
    width: 1,
    backgroundColor: colors.borderColor,
    marginHorizontal: 10,
  },
  // Style for the score text (points or streak).
  scoreText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    minWidth: 40,
    textAlign: 'right',
  },
  // Style for the container holding the "Global" and group tabs.
  tabsContainer: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  // Style for the tappable area of a tab.
  tabButton: {
    paddingBottom: 5,
  },
  // Style for the text inside a tab.
  tabText: {
    paddingHorizontal: 5,
    fontSize: 16,
    color: colors.textMuted,
  },
  // Style for the text of the currently active tab.
  tabTextActive: {
    color: colors.accent,
    fontWeight: 'bold',
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
});

/**
 * `Leaderboard` is the main component for the leaderboard screen.
 * It displays a ranked list of users based on selectable metrics (points, streaks).
 * It can show a global leaderboard or leaderboards for specific groups.
 */
export default function Leaderboard() {
  // --- Hooks for Navigation, Theming, and Styles ---

  // `useNavigation` hook gives us access to navigation actions.
  const navigation = useNavigation();
  // `useTheme` is our custom hook to get the current theme's colors and mode.
  const { colors: themeColors, isDark } = useTheme();
  // `useMemo` is a React hook for performance. It only recalculates the styles when the theme changes.
  const appGlobalStyles = useMemo(() => getGlobalStyles(themeColors), [themeColors]);
  const screenStyles = useMemo(() => getScreenStyles(themeColors, appGlobalStyles), [themeColors, appGlobalStyles]);


  // --- State Management ---
  // "State" is how a React component remembers information. We use the `useState` hook.
  
  // This state holds the array of user data for the leaderboard, ready to be displayed.
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardItem[]>([]);
  // This state tracks if the leaderboard is currently fetching data, used to show a loading spinner.
  const [isLoading, setIsLoading] = useState(true);
  // This state stores which metric is currently used for sorting (e.g., 'points').
  const [sortMetric, setSortMetric] = useState<SortMetricType>('points');
  // This state stores any error message if data fetching fails.
  const [error, setError] = useState<string | null>(null);
  // This state holds the unique ID of the currently logged-in user.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // This state holds the list of groups the user is a member of, for the tabs.
  const [userGroups, setUserGroups] = useState<{ id: string; name: string }[]>([]);
  // This state tracks which tab is currently active ('global' or a group's ID).
  const [activeTab, setActiveTab] = useState<string>('global');

  /**
   * `useEffect` is a React hook that runs side effects. This one sets up a listener
   * for authentication changes from Firebase. It runs once when the component is first created.
   */
  useEffect(() => {
    // This function runs whenever a user signs in or out.
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        // If a user is logged in, store their ID.
        setCurrentUserId(user.uid);
      } else {
        // If the user logs out, clear their ID and any leaderboard data.
        setCurrentUserId(null);
        setLeaderboardData([]);
      }
    });
    // This is the cleanup function. It runs when the component is removed from the screen
    // to prevent memory leaks by stopping the listener.
    return unsubscribe;
  }, []); // The empty array `[]` means this effect runs only once.

  /**
   * This function fetches the groups a user is part of.
   * `useCallback` is a performance optimization hook. It prevents this function
   * from being recreated on every render, unless `currentUserId` changes.
   */
  const fetchUserGroups = useCallback(async () => {
    if (currentUserId) {
      try {
        const groupIds = await getUserGroups(currentUserId);
        if (groupIds.length > 0) {
          // If the user is in groups, get the details (like name) for all those groups.
          const allGroups = await getAllGroups();
          const myGroups = allGroups.filter((g) => groupIds.includes(g.id));
          // Store the relevant info (id and name) in our state.
          setUserGroups(myGroups.map((g: any) => ({ id: g.id, name: g.name })));
        } else {
          setUserGroups([]); // If user is in no groups, ensure the list is empty.
        }
      } catch (error) {
        console.error("Failed to fetch user groups for leaderboard tabs:", error);
        setUserGroups([]); // Clear groups on error.
      }
    } else {
      setUserGroups([]); // If no user is logged in, clear groups.
    }
  }, [currentUserId]); // This function will be recreated only if `currentUserId` changes.

  /**
   * This `useEffect` hook is responsible for fetching the user's groups to display as tabs.
   * It runs when the user's ID is set and also re-fetches whenever the user navigates back to this screen.
   */
  useEffect(() => {
    fetchUserGroups(); // Fetch groups when the component first loads.
    // This creates a listener that re-fetches groups every time the screen comes into focus.
    const unsubscribe = navigation.addListener('focus', fetchUserGroups);
    return unsubscribe; // Cleanup the focus listener when the component unmounts.
  }, [navigation, fetchUserGroups]);

  /**
   * This function fetches the actual leaderboard data from our database services.
   * `useCallback` ensures this function is only recreated if `sortMetric` or `activeTab` changes.
   */
  const fetchLeaderboardData = useCallback(async () => {
    setIsLoading(true); // Show the loading spinner.
    setError(null); // Clear any previous errors.
    console.log(`[LeaderboardScreen] Fetching for tab: ${activeTab}, sorting by:`, sortMetric);
    try {
      // Decide which service function to call based on the active tab.
      const rankedUsers =
        activeTab === 'global'
          // If the 'global' tab is active, fetch the global leaderboard.
          ? await fetchLeaderboardDataFromService(sortMetric)
          // Otherwise, fetch the leaderboard for the specific group ID in `activeTab`.
          : await fetchGroupLeaderboardDataFromService(activeTab, sortMetric);

      // Update the state with the fetched data, which will cause the UI to re-render.
      setLeaderboardData(rankedUsers);
      console.log("[LeaderboardScreen] Leaderboard data received from service and set in state.");

    } catch (err: any) {
      console.error("[LeaderboardScreen] Error after calling leaderboard service:", err);
      // If an error occurs, store the error message and clear the data.
      setError(err.message || 'Failed to load leaderboard. Please try again.');
      setLeaderboardData([]);
    } finally {
      // This block always runs, regardless of success or failure.
      setIsLoading(false); // Hide the loading spinner.
    }
  }, [sortMetric, activeTab]); // Dependencies: this function re-runs if the sort metric or active tab changes.

  /**
   * This `useEffect` hook triggers the data fetching process.
   * It runs whenever `fetchLeaderboardData` itself is updated (which happens when its dependencies change).
   */
  useEffect(() => {
    fetchLeaderboardData();
  }, [fetchLeaderboardData]);

  /**
   * This function defines how to render a single user's row in the leaderboard list.
   * The `FlatList` component will call this function for each user in its `data` array.
   * @param item - The `LeaderboardItem` object containing one user's data.
   */
  const renderItem = ({ item }: { item: LeaderboardItem }) => {
    const isTopUser = item.rank === 1;
    // Check if the user is in the top 3 to apply special styling.
    const isTopThree = item.rank !== undefined && item.rank <= 3;
    // Choose the style for the rank circle based on whether the user is in the top 3.
    const rankCircleStyle = isTopThree ? screenStyles.rankCircleTop : screenStyles.rankCircleDefault;
    const rankTextStyle = isTopThree ? screenStyles.rankTextTop : screenStyles.rankText;

    // Determine which score to display based on the currently active sort metric.
    let scoreValue: number;
    switch (sortMetric) {
        case 'points': scoreValue = item.points; break;
        case 'currentStreak': scoreValue = item.currentStreak; break;
        case 'longestStreak': scoreValue = item.longestStreak; break;
        default: scoreValue = 0;
    }

    // This is the JSX that defines the visual structure of a single row.
    return (
      <View style={[screenStyles.itemContainer, isTopUser && screenStyles.topUserItemContainer]}>
        {/* The rank circle. */}
        <View style={[screenStyles.rankCircle, rankCircleStyle]}>
          <Text style={rankTextStyle}>{item.rank}</Text>
        </View>
        
        {/* The user's avatar. If they have a photoURL, display it. */}
        {item.photoURL ? (
          <Image source={{ uri: item.photoURL }} style={screenStyles.avatar} />
        ) : (
          // If not, display a placeholder with the first letter of their name.
          <View style={screenStyles.avatarPlaceholder}>
            <Text style={screenStyles.avatarPlaceholderText}>
              {item.displayName ? item.displayName.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
        )}
        
        {/* The user's name. It will truncate with "..." if it's too long. */}
        <Text style={screenStyles.nameText} numberOfLines={1} ellipsizeMode="tail">{item.displayName}</Text>
        
        {/* The separator line. */}
        <View style={screenStyles.separator} />
        
        {/* The user's score. */}
        <Text style={screenStyles.scoreText}>{scoreValue}</Text>
      </View>
    );
  };

  // --- Render Logic ---
  // This is the main JSX returned by the component, defining what the user sees on the screen.
  return (
    // The main container for the whole screen.
    <View style={[appGlobalStyles.screenContainer, screenStyles.outerContainerCustom]}>
      {/* This component controls the appearance of the system status bar (time, battery, etc.). */}
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} /> 

      {/* The header view containing the title. */}
      <View style={screenStyles.headerContainer}>
        <View style={screenStyles.headerTitleContainer}>
          <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom]}>Group </Text>
          <Text style={[appGlobalStyles.headerText, screenStyles.headerTitleCustom, screenStyles.headerTitleHighlight]}>Leaderboard</Text>
        </View>
      </View>

      {/* The container for the horizontal tabs ('Global', 'Group 1', etc.). */}
      <View style={screenStyles.tabsContainer}>
        {/* A `ScrollView` allows the tabs to be scrolled horizontally if there are too many to fit. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* The 'Global' tab is always present. */}
          <TouchableOpacity onPress={() => setActiveTab('global')} style={screenStyles.tabButton}>
            <Text style={[screenStyles.tabText, activeTab === 'global' && screenStyles.tabTextActive]}>
              Global
            </Text>
          </TouchableOpacity>
          {/* We `map` over the `userGroups` state to create a tab for each group the user is in. */}
          {userGroups.map((group) => (
            <TouchableOpacity key={group.id} onPress={() => setActiveTab(group.id)} style={screenStyles.tabButton}>
              <Text style={[screenStyles.tabText, activeTab === group.id && screenStyles.tabTextActive]}>
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* The container for the sort options ('Total Points', 'Current Streak', etc.). */}
      <View style={screenStyles.sortOptionsContainer}>
        {/* We `map` over our `SORT_METRICS` array to create a button for each option. */}
        {SORT_METRICS.map((option, index) => (
          // `React.Fragment` is an invisible wrapper, needed here to provide a `key` for the mapped items.
          <React.Fragment key={option.value}>
            <TouchableOpacity onPress={() => setSortMetric(option.value)}>
              <Text style={[
                appGlobalStyles.mutedText,          // Base style.
                screenStyles.sortOptionTextCustom,  // Screen-specific style.
                sortMetric === option.value && screenStyles.sortOptionTextActive // Style for when it's active.
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
            {/* This adds the "|" separator, but not after the last item. */}
            {index < SORT_METRICS.length - 1 && <Text style={screenStyles.sortSeparator}> | </Text>}
          </React.Fragment>
        ))}
      </View>

      {/* This is where we display the main content based on the current state. */}
      {isLoading ? (
        // If `isLoading` is true, show a loading spinner.
        <ActivityIndicator size="large" color={themeColors.accent} style={appGlobalStyles.centeredContainer} />
      ) : error ? (
        // If there's an `error`, display the error message.
        <Text style={[appGlobalStyles.errorText, screenStyles.errorTextCustom]}>{error}</Text>
      ) : leaderboardData.length === 0 ? (
        // If loading is done and there's no data, show an "empty" message.
        <Text style={[appGlobalStyles.bodyText, screenStyles.emptyTextCustom]}>
          {"The leaderboard is currently empty or no users match the criteria. Keep up the good work!"}
        </Text>
      ) : (
        // Otherwise, if we have data, display the list of users.
        <FlatList
          data={leaderboardData}      // The array of users to display.
          renderItem={renderItem}     // The function to render each row.
          keyExtractor={(item) => item.id} // A function to get a unique key for each row.
          contentContainerStyle={screenStyles.listContentContainer}
        />
      )}
    </View>
  );
}