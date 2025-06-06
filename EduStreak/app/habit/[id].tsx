import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { auth } from '../../config/firebase';
import { deleteHabit as deleteHabitService, getHabitDetails } from '../../services/habitService';
import { Habit } from '../../types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * `HabitDetailScreen` displays detailed information about a specific habit.
 * It fetches habit data based on the `habitId` passed through route parameters.
 * Users can view habit details, edit the habit, or delete it.
 * It handles loading, error, and authentication states.
 */
export default function HabitDetailScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const habitId = params.id as string;
  const [habit, setHabit] = useState<Habit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
        setHabit(null); 
        setIsLoading(false); 
        setError("User not authenticated. Please sign in.");
      }
    });
    return () => unsubscribe();
  }, [router]);

  /**
   * Fetches the details of the habit from the `habitService` using the `currentUserId` and `habitId`.
   * Sets the habit state, loading state, and error state based on the outcome of the fetch operation.
   * If `currentUserId` or `habitId` is not available, it sets an error and clears habit data.
   */
  const fetchHabitDetails = useCallback(async () => {
    if (!currentUserId || !habitId) {
      setHabit(null);
      setIsLoading(false);
      if (!currentUserId) setError("User not authenticated. Please sign in.");
      if (!habitId) setError("Habit ID not provided.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const fetchedHabit = await getHabitDetails(currentUserId, habitId);
      if (fetchedHabit) {
        setHabit(fetchedHabit);
      } else {
        setError('Habit not found.');
        setHabit(null);
      }
    } catch (e: any) {
      console.error("[HabitDetailScreen] Error fetching habit details via service: ", e);
      setError(e.message || 'Failed to load habit details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUserId, habitId]);

  useFocusEffect(
    useCallback(() => {
      navigation.setOptions({ headerShown: false });
      if (currentUserId) {
        fetchHabitDetails();
      }
    }, [navigation, fetchHabitDetails, currentUserId])
  );

  /**
   * Handles the deletion of the current habit.
   * Prompts the user for confirmation before proceeding with the deletion.
   * Calls the `deleteHabitService` to remove the habit from Firestore.
   * Navigates back to the previous screen on successful deletion.
   * Displays alerts for success or failure.
   */
  const handleDeleteHabit = async () => {
    if (!currentUserId || !habitId || !habit) {
      Alert.alert("Error", "Cannot delete habit: missing user, habit ID, or habit data.");
      return;
    }
    
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the habit "${habit.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            setIsDeleting(true);
            try {
              await deleteHabitService(currentUserId, habitId);
              Alert.alert("Success", `Habit "${habit.name}" deleted successfully.`);
              router.back();
            } catch (error: any) {
              console.error("[HabitDetailScreen] Error deleting habit via service: ", error);
              Alert.alert("Error", error.message || `Failed to delete habit. Please try again.`);
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };
  
  /**
   * Navigates to the EditHabitScreen for the current habit.
   * Passes the `habitId` as a route parameter to the edit screen.
   */
  const handleEditHabit = () => {
    if (!habitId) return;
    router.push({ pathname: '/habit/edit-habit', params: { habitId } }); 
  };

  /**
   * Handles navigation back to the previous screen.
   * If the router can go back, it does so. Otherwise, it replaces the current screen
   * with the main tabs screen as a fallback (e.g., if accessed via deep link).
   */
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if no screen to go back to (e.g., deep link)
      router.replace('/(tabs)'); 
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d05b52" />
        <Text style={styles.loadingText}>Loading Habit Details...</Text>
      </View>
    );
  }

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

  return (
    <View style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton} disabled={isDeleting}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{habit.name}</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Description</Text>
          <Text style={styles.detailValue}>{habit.description || 'N/A'}</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>
            {habit.frequency.type === 'daily'
              ? `Daily`
              : `Weekly: ${habit.frequency.days?.map((d: number) => DAYS_OF_WEEK[d]).join(', ') || 'N/A'}` +
                (habit.frequency.times && habit.frequency.times > 1 ? ` (${habit.frequency.times} times a week)` : '')}
          </Text>
        </View>

        <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Current Streak</Text>
            <Text style={styles.detailValue}>{habit.streak} day(s)</Text>
        </View>
        
        <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Longest Streak</Text>
            <Text style={styles.detailValue}>{habit.longestStreak} day(s)</Text>
        </View>

        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Created On</Text>
          <Text style={styles.detailValue}>{new Date(habit.createdAt).toLocaleDateString()}</Text>
        </View>
        
        <View style={styles.detailSection}>
          <Text style={styles.detailLabel}>Completion History</Text>
          {habit.completionHistory && habit.completionHistory.length > 0 ? (
            habit.completionHistory.slice(0, 10).map((entry, index) => ( // Show last 10 entries for brevity
              <Text key={index} style={styles.historyEntry}>
                {new Date(entry.date).toLocaleDateString()}
              </Text>
            ))
          ) : (
            <Text style={styles.detailValue}>No completion history yet.</Text>
          )}
        </View>

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

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 25 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#d05b52'
  },
  centeredMessageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 10,
  },
  backArrow: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1, // Allow title to take space and truncate
    textAlign: 'center',
    marginHorizontal: 5, // Give some space if title is long
  },
  headerRightPlaceholder: {
    width: 24 + 20, 
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  detailSection: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  historyEntry: {
    fontSize: 15,
    color: '#444444',
    marginBottom: 3,
  },
  errorText: {
    fontSize: 16,
    color: '#d05b52',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 16,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: '#d05b52',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#d05b52',
  },
  secondaryButtonText: {
    color: '#d05b52',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButtonBackground: {
    backgroundColor: '#cccccc',
    borderColor: '#cccccc',
  },
  disabledButtonOpacity: {
    opacity: 0.5,
  }
}); 