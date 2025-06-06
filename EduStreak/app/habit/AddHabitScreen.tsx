import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
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
import { Habit } from '../../types';

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
export default function AddHabitScreen({ onAddHabit, onCancel }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [timesPerWeek, setTimesPerWeek] = useState('1');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);

  /**
   * Validates the habit input fields and constructs the new habit data object.
   * Calls the `onAddHabit` prop with the new habit data.
   * Handles validation for habit name, times per week, and day selection for weekly habits.
   * Displays alerts for any validation errors.
   */
  const handleSaveHabit = () => {
    if (!name.trim()) {
      Alert.alert('Missing Name', 'Please enter a habit name.');
      return;
    }

    const baseDetails = {
      name: name.trim(),
      description: description.trim() || undefined,
      isDefault: false,
    };

    let newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt' | 'notes' | 'reminderTime'>;

    if (frequencyType === 'daily') {
      newHabitData = {
        ...baseDetails,
        name: baseDetails.name, 
        frequency: { type: 'daily', times: 1 },
      };
    } else { // weekly
      const times = parseInt(timesPerWeek, 10);
      if (isNaN(times) || times <= 0) {
        Alert.alert('Invalid Input', 'Please enter a valid number of times per week.');
        return;
      }
      if (selectedDays.length === 0) {
        Alert.alert('No Days Selected', 'Please select at least one day for a weekly habit.');
        return;
      }
      newHabitData = {
        ...baseDetails,
        name: baseDetails.name, 
        frequency: { type: 'weekly', times, days: selectedDays.sort((a, b) => a - b) },
      };
    }
    onAddHabit(newHabitData);
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
   * Handles the cancellation of habit creation.
   * If an `onCancel` prop is provided, it calls that function.
   * Otherwise, it navigates back to the previous screen using the router.
   */
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.pageContainer, Platform.OS === 'web' && styles.webModalContainer]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={handleCancel} style={styles.backButton}>
          <Image source={require('../../assets/icons/back_arrow.png')} style={styles.backArrow} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add New Habit</Text>
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
        />

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
            />
            <Text style={styles.label}>Select Days *</Text>
            <View style={styles.daysSelectorContainer}>
              {DAYS_OF_WEEK.map((dayName, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
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

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? 25 : 40,
  },
  webModalContainer: {
    width: '100%',
    maxWidth: 1200,
    maxHeight: '100%',
    alignSelf: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginTop: '0%',
    overflow: 'hidden',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: Platform.OS === 'web' ? '#ccc' : undefined,
    elevation: Platform.OS === 'web' ? 5 : 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
}); 