import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import 'react-native-get-random-values';
import { ColorScheme } from '../../constants/Colors';
import { useTheme } from '../../functions/themeFunctions/themeContext';
import { Habit } from '../../types';
import { showAlert } from "../../utils/showAlert";

interface Props {
  onAddHabit: (newHabit: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt' | 'notes' | 'reminderTime'>) => void;
  onCancel?: () => void; 
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * `AddHabitScreen` is a form component used for creating new habits.
 * It allows users to input habit details such as name, description, frequency (daily/weekly),
 * target times, specific days for weekly habits, notes, and an optional reminder time.
 *
 * @param {Props} props - The component's props.
 * @param props.onAddHabit - Callback function triggered when the user saves a new habit.
 *                           It receives the new habit data (excluding system-generated fields).
 * @param [props.onCancel] - Optional callback function triggered when the user cancels habit creation.
 *                           If not provided, the screen will navigate back.
 */

 /**
 * This function creates all the style rules for this screen.
 * It's theme-aware because it takes the `colors` object as an argument.
 * @param colors - An object containing all the colors for the current theme.
 * @returns A StyleSheet object containing all the styles for this component.
 */
 const getStyles = (colors: ColorScheme) => StyleSheet.create({
   // Style for the main container that fills the entire page or modal.
   pageContainer: {
     flex: 1,
     backgroundColor: colors.background,
     paddingTop: Platform.OS === 'android' ? 25 : 40,
   },
   // On web, we wrap the form in a modal-like container for better presentation.
   webModalContainer: {
     width: '100%',
     maxHeight: '100%',
     alignSelf: 'center',
     justifyContent: 'center',
     borderRadius: 8,
     marginTop: '0%',
     overflow: 'hidden',
     borderWidth: Platform.OS === 'web' ? 1 : 0,
     borderColor: Platform.OS === 'web' ? colors.borderColor : undefined,
     elevation: Platform.OS === 'web' ? 5 : 0,
     shadowColor: colors.shadow,
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
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
     backgroundColor: colors.headerBackground,
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
     tintColor: colors.icon,
   },
   // Style for the header title text.
   headerTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: colors.text,
   },
   // A placeholder view on the right to perfectly center the title.
   headerRightPlaceholder: {
     width: 24 + 20,
   },
   // Style for the scrollable area that contains the form fields.
   scrollView: {
     flex: 1,
   },
   // Style for the content inside the scroll view, adding padding.
   scrollViewContent: {
     paddingHorizontal: 20,
     paddingBottom: 30,
   },
   // Style for the text labels above each input field (e.g., "Habit Name").
   label: {
     fontSize: 16,
     color: colors.textDefault,
     marginTop: 20,
     marginBottom: 8,
     fontWeight: '500',
   },
   // General style for a text input field.
   input: {
     backgroundColor: colors.inputBackground,
     borderRadius: 10,
     paddingVertical: 12,
     paddingHorizontal: 15,
     fontSize: 16,
     color: colors.textInput,
     marginBottom: 10,
     borderColor: colors.inputBorder,
   },
   // Additional style for multi-line text inputs to give them more height.
   multilineInput: {
     minHeight: 80,
     textAlignVertical: 'top',
   },
   // Style for the container of the 'Daily'/'Weekly' segmented control.
   segmentedControlContainer: {
     flexDirection: 'row',
     backgroundColor: colors.inputBackground,
     borderRadius: 8,
     padding: 2,
     marginBottom: 15,
   },
   // Style for an individual button within the segmented control.
   segmentedControlButton: {
     flex: 1,
     paddingVertical: 10,
     alignItems: 'center',
     justifyContent: 'center',
     borderRadius: 7,
   },
   // Style applied to the *active* button in the segmented control.
   segmentedControlButtonActive: {
     backgroundColor: colors.background,
     shadowColor: colors.shadow,
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 2,
     elevation: 2,
   },
   // Style for the text inside a segmented control button.
   segmentedControlButtonText: {
     fontSize: 15,
     color: colors.textSecondary,
   },
   // Style for the text inside the *active* segmented control button.
   segmentedControlButtonTextActive: {
     color: colors.primary,
     fontWeight: 'bold',
   },
   // Style for the container that holds the row of day-of-the-week buttons.
   daysSelectorContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     marginBottom: 15,
   },
   // Style for a single day-of-the-week button (e.g., "Mon").
   dayButton: {
     backgroundColor: colors.inputBackground,
     paddingVertical: 10,
     paddingHorizontal: 12,
     borderRadius: 8,
     minWidth: '12%',
     alignItems: 'center',
     marginBottom: 8,
     borderWidth: 1,
     borderColor: colors.borderColor,
   },
   // Style applied to a day button when it is selected.
   dayButtonSelected: {
     backgroundColor: colors.primary,
     borderColor: colors.primary,
   },
   // Style for the text inside a day button.
   dayButtonText: {
     fontSize: 14,
     color: colors.textDefault,
   },
   // Style for the text inside a *selected* day button.
   dayButtonTextSelected: {
     color: colors.primaryText,
     fontWeight: 'bold',
   },
   // Style for the primary "Add Habit" button.
   primaryButton: {
     backgroundColor: colors.primary,
     borderRadius: 25,
     paddingVertical: 15,
     alignItems: 'center',
     marginTop: 20,
     marginBottom: 10,
   },
   // Style for the text inside the primary button.
   primaryButtonText: {
     color: colors.primaryText,
     fontSize: 16,
     fontWeight: 'bold',
   },
   // Style for the secondary "Cancel" button.
   secondaryButton: {
     backgroundColor: colors.background,
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
 });

export default function AddHabitScreen({ onAddHabit, onCancel }: Props) {
 // --- Hooks for Theming, Navigation, and State Management ---
 const { colors: themeColors } = useTheme(); // Get the current theme's colors.
   // Memoize styles to prevent recalculation on every render.
   const styles = useMemo(() => getStyles(themeColors), [themeColors]);
   const router = useRouter(); // For programmatic navigation (e.g., going back).

   // --- State Variables ---
   // `useState` creates state variables. When their value is updated, the component re-renders.
   const [name, setName] = useState(''); // For the habit name input.
   const [description, setDescription] = useState(''); // For the habit description input.
   const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily'); // To toggle between 'daily' and 'weekly'.
   const [timesPerWeek, setTimesPerWeek] = useState('1'); // For the 'times per week' input (as a string).
   const [selectedDays, setSelectedDays] = useState<number[]>([]); // To store the selected days (0=Sun, 1=Mon, etc.).


  /**
   * Validates the habit input fields and constructs the new habit data object.
   * Calls the `onAddHabit` prop with the new habit data.
   * Handles validation for habit name, times per week, and day selection for weekly habits.
   * Displays alerts for any validation errors.
   */
  const handleSaveHabit = () => {
    // --- Validation ---
    // 1. Ensure the habit has a name.
    if (!name.trim()) {
      showAlert('Missing Name', 'Please enter a habit name.');
      return; // Stop the function.
    }

    // --- Data Construction ---
    // Create the base object with common details.
    const baseDetails = {
      name: name.trim(),
      description: description.trim() || undefined, // Use `undefined` if description is empty, to not save an empty string.
      isDefault: false, // This is a user-created habit.
    };

    let newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt' | 'notes' | 'reminderTime'>;

    // 2. Construct the specific frequency object based on the selected type.
    if (frequencyType === 'daily') {
      newHabitData = {
        ...baseDetails,
        name: baseDetails.name, 
        frequency: { type: 'daily', times: 1 }, // Daily habits are always once per day.
      };
    } else { // weekly
      const times = parseInt(timesPerWeek, 10);
      // 3. For weekly habits, validate the 'times per week' and 'selected days' inputs.
      if (isNaN(times) || times <= 0) {
        showAlert('Invalid Input', 'Please enter a valid number of times per week.');
        return;
      }
      if (selectedDays.length === 0) {
        showAlert('No Days Selected', 'Please select at least one day for a weekly habit.');
        return;
      }
      newHabitData = {
        ...baseDetails,
        name: baseDetails.name, 
        // For weekly habits, store the times and the selected days (sorted for consistency).
        frequency: { type: 'weekly', times, days: selectedDays.sort((a, b) => a - b) },
      };
    }
    
    // --- Callback Execution ---
    // Call the onAddHabit function passed in via props, sending the new data to the parent.
    onAddHabit(newHabitData);
  };

  /**
   * Toggles the selection of a specific day for weekly habits.
   * If the day is already selected, it's removed; otherwise, it's added to the `selectedDays` state.
   * @param {number} dayIndex - The index of the day to toggle (0 for Sun, 1 for Mon, etc.).
   */
  const toggleDay = (dayIndex: number) => {
    // `setSelectedDays` with a function gives us the previous state (`prev`).
    setSelectedDays(prev =>
      // Check if the day is already in the array.
      prev.includes(dayIndex)
        // If yes, return a new array with that day filtered out.
        ? prev.filter(d => d !== dayIndex)
        // If no, return a new array with that day added to the end.
        : [...prev, dayIndex]
    );
  };

  /**
   * Handles the cancellation of habit creation.
   * If an `onCancel` prop is provided, it calls that function.
   * Otherwise, it navigates back to the previous screen using the router.
   */
  const handleCancel = () => {
    // This allows the component to be used in different contexts.
    // Sometimes a parent component wants to handle the cancel action itself (e.g., to close a modal).
    if (onCancel) {
      onCancel();
    } else {
      // If no specific cancel handler is provided, perform the default action: go back.
      router.back();
    }
  };

  // --- Render Logic ---
  // The component returns JSX, which describes what the UI should look like.
  return (
     // The main container. It uses a special style for web to look like a modal.
     <View style={[styles.pageContainer, Platform.OS === 'web' && styles.webModalContainer]}>
          {/* Custom Header */}
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
              <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add New Habit</Text>
            <View style={styles.headerRightPlaceholder} />
          </View>

          {/* The main form area is a ScrollView to allow scrolling on smaller screens. */}
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
            {/* Habit Name Input */}
            <Text style={styles.label}>Habit Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Drink Water, Read for 30 mins"
              placeholderTextColor={themeColors.placeholderText}
            />

            {/* Description Input */}
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Stay hydrated throughout the day"
              placeholderTextColor={themeColors.placeholderText}
              multiline // Allows multiple lines of text.
              numberOfLines={3}
            />

            {/* Frequency Type Selector (Daily/Weekly) */}
            <Text style={styles.label}>Frequency Type</Text>
            <View style={styles.segmentedControlContainer}>
              <TouchableOpacity
                style={[styles.segmentedControlButton, frequencyType === 'daily' && styles.segmentedControlButtonActive]}
                onPress={() => setFrequencyType('daily')}
              >
                <Text style={[styles.segmentedControlButtonText, frequencyType === 'daily' && styles.segmentedControlButtonTextActive]}>Daily</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentedControlButton, frequencyType === 'weekly' && styles.segmentedControlButtonActive]}
                onPress={() => setFrequencyType('weekly')}
              >
                <Text style={[styles.segmentedControlButtonText, frequencyType === 'weekly' && styles.segmentedControlButtonTextActive]}>Weekly</Text>
              </TouchableOpacity>
            </View>

            {/* --- Conditional Rendering for Weekly Frequency --- */}
            {/* This block of UI is only shown if `frequencyType` is 'weekly'. */}
            {frequencyType === 'weekly' && (
              // A React "Fragment" (<>) is used to group multiple elements without adding an extra node to the DOM.
              <>
                {/* Times Per Week Input */}
                <Text style={styles.label}>Times per week *</Text>
                <TextInput
                  style={styles.input}
                  value={timesPerWeek}
                  onChangeText={setTimesPerWeek}
                  placeholder="e.g., 3"
                  placeholderTextColor={themeColors.placeholderText}
                  keyboardType="numeric" // Shows a number pad on mobile devices.
                />

                {/* Day Selector */}
                <Text style={styles.label}>Select Days *</Text>
                <View style={styles.daysSelectorContainer}>
                  {/* We map over the DAYS_OF_WEEK array to create a button for each day. */}
                  {DAYS_OF_WEEK.map((dayName, index) => (
                    <TouchableOpacity
                      key={index} // A unique key is required for each item in a list.
                      style={[
                        styles.dayButton,
                        // Apply the 'selected' style if the day's index is in the `selectedDays` array.
                        selectedDays.includes(index) && styles.dayButtonSelected,
                      ]}
                      onPress={() => toggleDay(index)}
                    >
                      <Text style={[
                        styles.dayButtonText,
                        selectedDays.includes(index) && styles.dayButtonTextSelected,
                      ]}>{dayName}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            )}

            {/* Action Buttons */}
            <TouchableOpacity style={styles.primaryButton} onPress={handleSaveHabit}>
              <Text style={styles.primaryButtonText}>Add Habit</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleCancel}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      );
    }