import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { deleteField } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../config/firebase';
import { getHabitDetails, updateHabitDetails as updateHabitService } from '../../services/habitService';
import { Habit } from '../../types';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * `EditHabitScreen` allows users to modify an existing habit.
 * It fetches the habit's current details using `habitId` from route parameters
 * and populates a form similar to `AddHabitScreen`.
 * Users can change habit name, description, frequency, reminder time, and notes.
 * Changes are saved by calling the `updateHabitService`.
 * Handles loading, saving, and error states.
 */
export default function EditHabitScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { habitId: routeHabitId } = useLocalSearchParams<{ habitId: string }>();
  const currentUserId = auth.currentUser?.uid;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [timesPerWeek, setTimesPerWeek] = useState('1');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  // Reminder Time States
  const [reminderTime, setReminderTime] = useState<Date | undefined>(undefined);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Parses a time string (HH:MM) into a Date object for the current day.
   * @param {string} timeString - The time string to parse (e.g., "14:30").
   * @returns {Date | undefined} A Date object if parsing is successful, otherwise undefined.
   */
  const parseTimeStringToDate = (timeString: string): Date | undefined => {
    if (!timeString || !timeString.includes(':')) return undefined;
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return undefined;
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  /**
   * Formats a Date object into a "HH:MM" string representation.
   * @param {Date | undefined} date - The Date object to format. If undefined, returns an empty string.
   * @returns {string} The formatted time string (e.g., "09:30") or an empty string.
   */
  const formatTime = (date: Date | undefined): string => {
    if (!date) return '';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
    if (!routeHabitId || !currentUserId) {
      Alert.alert("Error", "Habit ID or User ID is missing for fetching.");
      if(router.canGoBack()) router.back(); else router.replace('/(tabs)');
      return;
    }
    setIsLoading(true);
    const fetchAndSetHabitDetails = async () => {
      try {
        const habitData = await getHabitDetails(currentUserId, routeHabitId);
        if (habitData) {
          setName(habitData.name);
          setDescription(habitData.description || '');
          setFrequencyType(habitData.frequency.type);
          if (habitData.frequency.type === 'daily') {
            setTimesPerDay(String(habitData.frequency.times || 1));
          } else if (habitData.frequency.type === 'weekly') {
            setTimesPerWeek(String(habitData.frequency.times || 1));
            setSelectedDays(habitData.frequency.days || []);
          }
          setNotes(habitData.notes || '');
          if (habitData.reminderTime) {
            setReminderTime(parseTimeStringToDate(habitData.reminderTime));
          }
        } else {
          Alert.alert("Error", "Habit not found for editing.");
          if(router.canGoBack()) router.back(); else router.replace('/(tabs)');
        }
      } catch (e: any) {
        console.error("[EditHabitScreen] Error fetching habit for editing via service: ", e);
        Alert.alert("Error", e.message || "Could not load habit details for editing.");
        if(router.canGoBack()) router.back(); else router.replace('/(tabs)');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAndSetHabitDetails();
  }, [navigation, routeHabitId, currentUserId, router]);

  /**
   * Handles the change event from the DateTimePicker for reminder time selection.
   * Updates the `reminderTime` state with the selected time.
   * Manages the visibility of the time picker based on platform and event type.
   * @param {DateTimePickerEvent} event - The event object from the DateTimePicker.
   * @param {Date} [selectedTime] - The time selected by the user.
   */
  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (event.type === 'dismissed') {
      // User dismissed the picker, do nothing or reset to previous time if needed
      if (Platform.OS !== 'ios') setShowTimePicker(false); // Close on Android if dismissed
      return;
    }
    if (selectedTime) {
      setReminderTime(selectedTime);
    }
    if (Platform.OS !== 'ios') setShowTimePicker(false); // Close on Android after selection
  };

  /**
   * Clears the currently set reminder time by setting `reminderTime` state to undefined.
   */
  const clearReminderTime = () => {
    setReminderTime(undefined);
  };

  /**
   * Handles the process of updating an existing habit.
   * Validates required fields (name, frequency details).
   * Constructs an update object, using `deleteField()` for optional fields that are cleared.
   * Calls `updateHabitService` to persist changes to Firestore.
   * Manages saving state and displays alerts for success or failure.
   */
  const handleUpdateHabit = async () => {
    if (!routeHabitId || !currentUserId) {
      Alert.alert("Error", "Cannot update habit: Missing ID or User session.");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Validation Error", 'Please enter a habit name.');
      return;
    }

    let frequency: Habit['frequency'];
    if (frequencyType === 'daily') {
      const times = parseInt(timesPerDay, 10);
      if (isNaN(times) || times <= 0) {
        Alert.alert("Validation Error", 'Please enter a valid number of times per day.');
        return;
      }
      frequency = { type: 'daily', times };
    } else { 
      const times = parseInt(timesPerWeek, 10);
      if (isNaN(times) || times < 0) {
        Alert.alert("Validation Error", 'Please enter a valid number of times per week (0 or more).');
        return;
      }
      if (selectedDays.length === 0 && times > 0) { 
        Alert.alert("Validation Error", 'Please select at least one day for weekly frequency when times > 0.');
        return;
      }
      frequency = { type: 'weekly', times, days: selectedDays.sort((a, b) => a - b) };
    }

    // Prepare data for Firestore update, handling deletions correctly
    const updatedHabitData: { [key: string]: any } = {
      name: name.trim(),
      frequency: frequency,
    };

    const descTrimmed = description.trim();
    if (descTrimmed) {
      updatedHabitData.description = descTrimmed;
    } else {
      updatedHabitData.description = deleteField();
    }

    const notesTrimmed = notes.trim();
    if (notesTrimmed) {
      updatedHabitData.notes = notesTrimmed;
    } else {
      updatedHabitData.notes = deleteField();
    }

    if (reminderTime) {
      updatedHabitData.reminderTime = formatTime(reminderTime);
    } else {
      updatedHabitData.reminderTime = deleteField();
    }

    // isDefault is not editable in this screen, so it's not included in updates
    // createdAt is set on creation and should not be updated here.
    // streak and longestStreak are managed by other logic (e.g., completion checks)

    setIsSaving(true);
    try {
      await updateHabitService(currentUserId, routeHabitId, updatedHabitData);
      Alert.alert("Success", "Habit updated successfully!");
      router.back(); 
    } catch (e: any) {
      console.error("[EditHabitScreen] Error updating habit via service: ", e);
      Alert.alert("Error", e.message || "Failed to update habit. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Toggles the selection of a specific day for weekly habits.
   * If the day is already selected, it's removed; otherwise, it's added to the `selectedDays` state.
   * @param {number} dayIndex - The index of the day to toggle (0 for Sun, 1 for Mon, etc.).
   */
  const toggleDay = (dayIndex: number) => {
    setSelectedDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };
  
  /**
   * Handles the cancellation of habit editing.
   * Navigates back to the previous screen if possible, otherwise replaces with the main tabs screen.
   */
  const handleCancel = () => {
    if (router.canGoBack()) {
        router.back();
    } else {
        router.replace('/(tabs)'); 
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#d05b52" />
        <Text style={styles.loadingText}>Loading Habit...</Text>
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton} disabled={isSaving}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Habit</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <Text style={styles.label}>Habit Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g., Drink Water, Read for 30 mins"
          placeholderTextColor="#A9A9A9"
          editable={!isSaving}
        />

        <Text style={styles.label}>Description (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Stay hydrated throughout the day"
          placeholderTextColor="#A9A9A9"
          multiline
          numberOfLines={3}
          editable={!isSaving}
        />

        <Text style={styles.label}>Frequency Type</Text>
        <View style={styles.segmentedControlContainer}>
          <TouchableOpacity
            style={[styles.segmentedControlButton, frequencyType === 'daily' && styles.segmentedControlButtonActive]}
            onPress={() => !isSaving && setFrequencyType('daily')}
            disabled={isSaving}
          >
            <Text style={[styles.segmentedControlButtonText, frequencyType === 'daily' && styles.segmentedControlButtonTextActive]}>Daily</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentedControlButton, frequencyType === 'weekly' && styles.segmentedControlButtonActive]}
            onPress={() => !isSaving && setFrequencyType('weekly')}
            disabled={isSaving}
          >
            <Text style={[styles.segmentedControlButtonText, frequencyType === 'weekly' && styles.segmentedControlButtonTextActive]}>Weekly</Text>
          </TouchableOpacity>
        </View>

        {frequencyType === 'daily' && (
          <>
            <Text style={styles.label}>Times per day *</Text>
            <TextInput
              style={styles.input}
              value={timesPerDay}
              onChangeText={setTimesPerDay}
              placeholder="e.g., 2"
              placeholderTextColor="#A9A9A9"
              keyboardType="numeric"
              editable={!isSaving}
            />
          </>
        )}

        {frequencyType === 'weekly' && (
          <>
            <Text style={styles.label}>Times per week *</Text>
            <TextInput
              style={styles.input}
              value={timesPerWeek}
              onChangeText={setTimesPerWeek}
              placeholder="e.g., 3"
              placeholderTextColor="#A9A9A9"
              keyboardType="numeric"
              editable={!isSaving}
            />
            <Text style={styles.label}>Select Days *</Text>
            <View style={styles.daysSelectorContainer}>
              {DAYS_OF_WEEK.map((dayName, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(index) && styles.dayButtonSelected,
                    isSaving && styles.disabledButtonOpacity
                  ]}
                  onPress={() => !isSaving && toggleDay(index)}
                  disabled={isSaving}
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

        <Text style={styles.label}>Notes (Optional)</Text>
        <TextInput
          style={[styles.input, styles.multilineInput]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Any extra details, links, or motivation"
          placeholderTextColor="#A9A9A9"
          multiline
          numberOfLines={4}
          editable={!isSaving}
        />

        <Text style={styles.label}>Reminder Time (Optional)</Text>
        <View style={styles.timeInputContainer}>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timePickerButton} disabled={isSaving}>
              <Text style={styles.timePickerButtonText}>
                {reminderTime ? formatTime(reminderTime) : 'Select Reminder Time'}
              </Text>
            </TouchableOpacity>
            {reminderTime && (
                <TouchableOpacity onPress={clearReminderTime} style={styles.clearTimeButton} disabled={isSaving}>
                    <Text style={styles.clearTimeButtonText}>Clear</Text>
                </TouchableOpacity>
            )}
        </View>
        {showTimePicker && (
          <DateTimePicker
            testID="editTimePicker"
            value={reminderTime || new Date()} // Default to now if no time is set
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

        <TouchableOpacity 
            style={[styles.primaryButton, isSaving && styles.disabledButtonBackground]} 
            onPress={handleUpdateHabit} 
            disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? "Saving..." : "Save Changes"}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
            style={[styles.secondaryButton, isSaving && styles.disabledButtonOpacity]} 
            onPress={handleCancel} 
            disabled={isSaving}
        >
          <Text style={styles.secondaryButtonText}>Cancel</Text>
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
  label: {
    fontSize: 16,
    color: '#333333',
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#000000',
    marginBottom: 10,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  segmentedControlContainer: {
    flexDirection: 'row',
    backgroundColor: '#EFEFF4',
    borderRadius: 8,
    padding: 2,
    marginBottom: 15,
  },
  segmentedControlButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
  },
  segmentedControlButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentedControlButtonText: {
    fontSize: 15,
    color: '#000000',
  },
  segmentedControlButtonTextActive: {
    color: '#d05b52',
    fontWeight: 'bold',
  },
  daysSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayButton: {
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: '12%',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  dayButtonSelected: {
    backgroundColor: '#d05b52',
    borderColor: '#d05b52',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#000000',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  primaryButton: {
    backgroundColor: '#d05b52',
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
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
  },
  disabledButtonOpacity: {
    opacity: 0.5,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  timePickerButton: {
    flex: 1, // Take available space
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginRight: 5, // Space if clear button is present
  },
  timePickerButtonText: {
    fontSize: 16,
    color: '#000000',
  },
  clearTimeButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#e74c3c', // A red color for clear
    borderRadius: 10,
  },
  clearTimeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 