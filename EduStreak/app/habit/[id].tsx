// --- Imports ---
// These lines bring in necessary code from other libraries and files.

// `expo-router` provides hooks for navigation, getting route parameters, and handling screen focus.
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
// Firebase Authentication provides functions to manage user sign-in state.
import { onAuthStateChanged, User } from 'firebase/auth';
// `React` is the core library for building the user interface. We import its hooks.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
// These are the visual building blocks from React Native, like Text, View, Spinners, etc.
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// --- Local Project Imports ---
// These lines bring in code from other files within our own project.

// Our Firebase configuration so we can get the current user.
import { auth } from '../../config/firebase';
// The TypeScript type definition for our color scheme.
import { ColorScheme } from '../../constants/Colors';
// Functions to delete and get habit details from our database.
import { deleteHabit as deleteHabitService, getHabitDetails } from '../../functions/habitService';
// Our custom hook to get the current theme (light/dark mode) and its colors.
import { useTheme } from '../../functions/themeFunctions/themeContext';
// The TypeScript type definition for a Habit object.
import { Habit } from '../../types';
// Utility functions to show simple alerts and confirmation dialogs.
import { showAlert, showConfirmationDialog } from "../../utils/showAlert";

// A constant array holding the names of the days of the week. Used for displaying weekly frequency.
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * This function creates all the style rules for this screen.
 * It's theme-aware because it takes the `colors` object as an argument.
 * @param colors - An object containing all the colors for the current theme.
 * @returns A StyleSheet object containing all the styles for this component.
 */
const getStyles = (colors: ColorScheme) => StyleSheet.create({
  // Style for the main container that fills the entire page.
  pageContainer: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 25 : 40,
  },
  // Style for the container shown while data is loading.
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  // Style for the text below the loading spinner.
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.primary
  },
  // Style for a container used to show a centered message (e.g., an error).
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  // Style for the header section at the top of the screen.
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderColor,
  },
  // Style for the tappable area of the back button.
  backButton: {
    padding: 10,
  },
  // Style for the back arrow image itself.
  backArrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  // Style for the header title text.
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1, // Allows the title to take up available space.
    textAlign: 'center',
    marginHorizontal: 5, // Gives space around the title.
  },
  // A placeholder view on the right to perfectly center the title.
  headerRightPlaceholder: {
    width: 24 + 20,
  },
  // Style for the scrollable area that contains the habit details.
  scrollView: {
    flex: 1,
  },
  // Style for the content inside the scroll view, adding padding.
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  // Style for a card-like section that displays a single piece of detail.
  detailSection: {
    backgroundColor: colors.cardBackground,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  // Style for the label within a detail section (e.g., "Description").
  detailLabel: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: 5,
    fontWeight: '500',
  },
  // Style for the value within a detail section (e.g., the actual description text).
  detailValue: {
    fontSize: 16,
    color: colors.textDefault,
    lineHeight: 22,
  },
  // Style for a single entry in the completion history list.
  historyEntry: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 3,
  },
  // Style for displaying error text.
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Style for general informational text.
  infoText: {
    fontSize: 16,
    color: colors.textDefault,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Style for the primary "Edit Habit" button.
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  // Style for the text inside the primary button.
  primaryButtonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Style for the secondary "Delete Habit" button.
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  // Style for the text inside the secondary button.
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Style to change the button's background when it's disabled.
  disabledButtonBackground: {
    backgroundColor: colors.textMuted,
    borderColor: colors.textMuted,
  },
  // Style to make a button semi-transparent when it's disabled.
  disabledButtonOpacity: {
    opacity: 0.5,
  }
});

/**
 * `HabitDetailScreen` displays detailed information about a specific habit.
 * It fetches habit data based on the `habitId` passed from the previous screen.
 * Users can view all details, and navigate to edit or delete the habit.
 */
export default function HabitDetailScreen() {
  // --- Hooks for Navigation, Theming, and State Management ---
  const router = useRouter(); // For programmatic navigation.
  const navigation = useNavigation(); // For setting screen options.
  const params = useLocalSearchParams(); // To get the habitId from the URL.
  const { colors: themeColors } = useTheme(); // Get the current theme's colors.
  const styles = useMemo(() => getStyles(themeColors), [themeColors]); // Memoize styles.

  // The ID of the habit to display, taken from the route parameters.
  const habitId = params.id as string;

  // --- State Variables ---
  const [habit, setHabit] = useState<Habit | null>(null); // To store the fetched habit data.
  const [isLoading, setIsLoading] = useState(true); // To show a loading spinner.
  const [error, setError] = useState<string | null>(null); // To store any error message.
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // To store the logged-in user's ID.
  const [isDeleting, setIsDeleting] = useState(false); // To show a "Deleting..." state on the button.

  /**
   * This `useEffect` hook runs once to set up a listener for Firebase authentication.
   * It updates the `currentUserId` state whenever a user logs in or out.
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        // If a user is logged in, store their ID.
        setCurrentUserId(user.uid);
      } else {
        // If no user is logged in, clear all data and show an error.
        setCurrentUserId(null);
        setHabit(null);
        setIsLoading(false);
        setError("User not authenticated. Please sign in.");
      }
    });
    // Cleanup function to remove the listener when the component is unmounted.
    return () => unsubscribe();
  }, [router]);

  /**
   * Fetches the details of the habit from the database service.
   * `useCallback` is a performance optimization that prevents this function from
   * being recreated on every render, unless its dependencies (`currentUserId`, `habitId`) change.
   */
  const fetchHabitDetails = useCallback(async () => {
    // Make sure we have a user and a habit ID before trying to fetch.
    if (!currentUserId || !habitId) {
      setHabit(null);
      setIsLoading(false);
      if (!currentUserId) setError("User not authenticated. Please sign in.");
      if (!habitId) setError("Habit ID not provided.");
      return; // Stop the function.
    }

    setIsLoading(true); // Show the loading spinner.
    setError(null); // Clear any previous errors.
    try {
      // Call the service function to get data from Firestore.
      const fetchedHabit = await getHabitDetails(currentUserId, habitId);
      if (fetchedHabit) {
        // If we get a habit, store it in state.
        setHabit(fetchedHabit);
      } else {
        // If no habit is found for that ID, set an error.
        setError('Habit not found.');
        setHabit(null);
      }
    } catch (e: any) {
      console.error("[HabitDetailScreen] Error fetching habit details: ", e);
      setError(e.message || 'Failed to load habit details. Please try again.');
    } finally {
      // This block always runs, on success or failure.
      setIsLoading(false); // Hide the loading spinner.
    }
  }, [currentUserId, habitId]);

  /**
   * `useFocusEffect` is a hook from Expo Router. The code inside it runs every
   * time the user navigates *to* this screen. This is useful for re-fetching data
   * to ensure it's up to date if it was changed on another screen (like the edit screen).
   */
  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false }); // Use our custom header.
      if (currentUserId) {
        fetchHabitDetails(); // Re-fetch the data when the screen comes into focus.
      }
    }, [navigation, fetchHabitDetails, currentUserId])
  );

  /**
   * Handles the deletion of the current habit.
   * It shows a confirmation dialog before calling the delete service.
   */
  const handleDeleteHabit = async () => {
    // Pre-delete validation.
    if (!currentUserId || !habitId || !habit) {
      showAlert("Error", "Cannot delete habit: missing data.");
      return;
    }

    // This is the function that will run if the user confirms the deletion.
    const deleteAction = async () => {
      setIsDeleting(true); // Put the UI into a "deleting" state.
      try {
        // Call the service function to delete the habit from Firestore.
        await deleteHabitService(currentUserId, habitId);
        showAlert("Success", `Habit "${habit.name}" deleted successfully.`);
        router.push('/'); // Navigate back to the home screen on success.
      } catch (error: any) {
        console.error("[HabitDetailScreen] Error deleting habit: ", error);
        showAlert("Error", error.message || `Failed to delete habit. Please try again.`);
        setIsDeleting(false); // Reset the UI state if deletion fails.
      }
    };

    // Show the pop-up confirmation dialog to the user.
    showConfirmationDialog(
      "Confirm Delete",
      `Are you sure you want to delete the habit "${habit.name}"? This action cannot be undone.`,
      deleteAction, // The function to run on confirmation.
      "Delete"      // The text for the confirm button.
    );
  };

  /**
   * Navigates to the EditHabitScreen for the current habit.
   * It passes the `habitId` as a route parameter so the edit screen knows which habit to load.
   */
  const handleEditHabit = () => {
    if (!habitId) return;
    router.push({ pathname: '/habit/edit-habit', params: { habitId } });
  };

  /**
   * Handles navigation back to the previous screen.
   */
  const handleGoBack = () => {
    // A safe way to go back. If there's no screen to go back to, it goes to the home screen.
    if (router.canGoBack()) {
      router.push('/');
    }
  };


  // --- Render Logic ---
  // The component returns different UI based on its current state (loading, error, or success).

  // 1. If data is still loading, show a loading spinner.
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Loading Habit Details...</Text>
      </View>
    );
  }

  // 2. If there was an error, show the error message.
  if (error) {
    return (
      <View style={styles.pageContainer}>
         <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 3. If loading is done but the habit is not found, show a "not found" message.
  if (!habit) {
    return (
      <View style={styles.pageContainer}>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
            <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Not Found</Text>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.centeredMessageContainer}>
          <Text style={styles.infoText}>Habit not found or could not be loaded.</Text>
          <TouchableOpacity style={styles.primaryButton} onPress={handleGoBack}>
            <Text style={styles.primaryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 4. If loading is complete and we have a habit, render the full details page.
  return (
    <View style={styles.pageContainer}>
      {/* Custom Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton} disabled={isDeleting}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
        </TouchableOpacity>
        {/* The title will truncate with "..." if the name is too long. */}
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{habit.name}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Scrollable content area */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        {/* Description Section */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{habit.description || 'N/A'}</Text>
        </View>

        {/* Frequency Section */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>
            {habit.frequency.type === 'daily'
              ? `Daily`
              : `Weekly: ${habit.frequency.days?.map((d: number) => DAYS_OF_WEEK[d]).join(', ') || 'N/A'}` +
                (habit.frequency.times && habit.frequency.times > 1 ? ` (${habit.frequency.times} times a week)` : '')}
          </Text>
        </View>

        {/* Current Streak Section */}
        <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Current Streak</Text>
            <Text style={styles.detailValue}>{habit.streak} day(s)</Text>
        </View>

        {/* Longest Streak Section */}
        <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Longest Streak</Text>
            <Text style={styles.detailValue}>{habit.longestStreak} day(s)</Text>
        </View>

        {/* Created On Section */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Created On</Text>
          <Text style={styles.detailValue}>{new Date(habit.createdAt).toLocaleDateString()}</Text>
        </View>

        {/* Completion History Section */}
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Completion History</Text>
          {habit.completionHistory && habit.completionHistory.length > 0 ? (
            // Show last 10 entries for brevity.
            habit.completionHistory.slice(0, 10).map((entry, index) => (
              <Text key={index} style={styles.historyEntry}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
            ))
          ) : (
            <Text style={styles.detailValue}>No completion history yet.</Text>
          )}
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 30 }, isDeleting && styles.disabledButtonOpacity]}
            onPress={handleEditHabit}
            disabled={isDeleting}
        >
          <Text style={styles.primaryButtonText}>Edit Habit</Text>
        </TouchableOpacity>

        <TouchableOpacity
            style={[styles.secondaryButton, isDeleting && styles.disabledButtonBackground]}
            onPress={handleDeleteHabit}
            disabled={isDeleting}
        >
          <Text style={styles.secondaryButtonText}>{isDeleting ? "Deleting..." : "Delete Habit"}</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}
