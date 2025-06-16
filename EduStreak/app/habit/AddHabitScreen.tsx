import { useRouter } from 'expo-router';
import React, { useState, useMemo } from 'react'; // << useMemo toegevoegd
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
import { Habit } from '../../types';
import { showAlert } from "../../utils/showAlert";
import { useTheme } from '../../functions/themeFunctions/themeContext'; // << NIEUW (pas pad aan indien nodig)
import { ColorScheme } from '../../functions/themeFunctions/themeContext'; // << NIEUW (pas pad aan indien nodig)

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

 const getStyles = (colors: ColorScheme) => StyleSheet.create({
   pageContainer: {
     flex: 1,
     backgroundColor: colors.background, // Was #FFFFFF
     paddingTop: Platform.OS === 'android' ? 25 : 40,
   },
   webModalContainer: { // Deze blijft grotendeels hetzelfde, maar borderColor en shadowColor kunnen thematisch
     width: '100%',
     maxHeight: '100%',
     alignSelf: 'center',
     justifyContent: 'center',
     borderRadius: 8,
     marginTop: '0%',
     overflow: 'hidden',
     borderWidth: Platform.OS === 'web' ? 1 : 0,
     borderColor: Platform.OS === 'web' ? colors.borderColor : undefined, // Was #ccc
     elevation: Platform.OS === 'web' ? 5 : 0,
     shadowColor: colors.shadow, // Was #000
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1, // Shadow opacity is vaak prima om vast te houden
     shadowRadius: 4,
   },
   headerContainer: {
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'space-between',
     paddingHorizontal: 15,
     paddingBottom: 10,
     borderBottomWidth: 1,
     borderBottomColor: colors.borderColor, // Was #E0E0E0
     backgroundColor: colors.headerBackground, // Optioneel: als de header hier zijn eigen achtergrond nodig heeft
   },
   backButton: {
     padding: 10,
   },
   backArrow: { // De pijl zelf is een afbeelding, maar als je een icon font zou gebruiken, zou de kleur thematisch zijn
     width: 24,
     height: 24,
     resizeMode: 'contain',
     tintColor: colors.icon, // Als het een monochrome icoon is die je wilt herkleuren
   },
   headerTitle: {
     fontSize: 20,
     fontWeight: 'bold',
     color: colors.text, // Was #000000
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
     color: colors.textDefault, // Was #333333
     marginTop: 20,
     marginBottom: 8,
     fontWeight: '500',
   },
   input: {
     backgroundColor: colors.inputBackground, // Was #F5F5F5
     borderRadius: 10,
     paddingVertical: 12,
     paddingHorizontal: 15,
     fontSize: 16,
     color: colors.textInput, // Was #000000
     marginBottom: 10,
     borderColor: colors.inputBorder, // Optioneel: voeg een border toe indien gewenst
     // borderWidth: 1, // Indien je een border wilt
   },
   multilineInput: {
     minHeight: 80,
     textAlignVertical: 'top',
   },
   segmentedControlContainer: {
     flexDirection: 'row',
     backgroundColor: colors.inputBackground, // Was #EFEFF4, maak het consistent met input velden
     borderRadius: 8,
     padding: 2, // Houd padding voor het "inset" effect van de actieve knop
     marginBottom: 15,
   },
   segmentedControlButton: {
     flex: 1,
     paddingVertical: 10,
     alignItems: 'center',
     justifyContent: 'center',
     borderRadius: 7, // Iets kleiner dan de container voor het "inset" effect
   },
   segmentedControlButtonActive: {
     backgroundColor: colors.background, // Was #FFFFFF, maak het de pagina achtergrond
     // Voor dark mode, als background erg donker is, overweeg colors.cardBackground
     shadowColor: colors.shadow, // Was #000
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 2,
     elevation: 2,
   },
   segmentedControlButtonText: {
     fontSize: 15,
     color: colors.textSecondary, // Was #000000, maak het iets minder prominent voor niet-actief
   },
   segmentedControlButtonTextActive: {
     color: colors.primary, // Was #d05b52
     fontWeight: 'bold',
   },
   daysSelectorContainer: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     justifyContent: 'space-between',
     marginBottom: 15,
   },
   dayButton: {
     backgroundColor: colors.inputBackground, // Was #F5F5F5
     paddingVertical: 10,
     paddingHorizontal: 12,
     borderRadius: 8,
     minWidth: '12%',
     alignItems: 'center',
     marginBottom: 8,
     borderWidth: 1,
     borderColor: colors.borderColor, // Was #E0E0E0
   },
   dayButtonSelected: {
     backgroundColor: colors.primary, // Was #d05b52
     borderColor: colors.primary, // Was #d05b52
   },
   dayButtonText: {
     fontSize: 14,
     color: colors.textDefault, // Was #000000
   },
   dayButtonTextSelected: {
     color: colors.primaryText, // Was #FFFFFF
     fontWeight: 'bold',
   },
   primaryButton: {
     backgroundColor: colors.primary, // Was #d05b52
     borderRadius: 25,
     paddingVertical: 15,
     alignItems: 'center',
     marginTop: 20,
     marginBottom: 10,
   },
   primaryButtonText: {
     color: colors.primaryText, // Was #FFFFFF
     fontSize: 16,
     fontWeight: 'bold',
   },
   secondaryButton: {
     backgroundColor: colors.background, // Was #FFFFFF, maak het de pagina achtergrond
     // of colors.cardBackground als je een subtiel "raised" effect wilt
     borderRadius: 25,
     paddingVertical: 15,
     alignItems: 'center',
     marginBottom: 20,
     borderWidth: 1,
     borderColor: colors.primary, // Was #d05b52
   },
   secondaryButtonText: {
     color: colors.primary, // Was #d05b52
     fontSize: 16,
     fontWeight: 'bold',
   },
 });

export default function AddHabitScreen({ onAddHabit, onCancel }: Props) {
 const { colors: themeColors } = useTheme(); // << NIEUW
   const styles = useMemo(() => getStyles(themeColors), [themeColors]); // << NIEUW

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
      showAlert('Missing Name', 'Please enter a habit name.');
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
              placeholderTextColor={themeColors.placeholderText} // Was #A9A9A9
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={description}
              onChangeText={setDescription}
              placeholder="e.g., Stay hydrated throughout the day"
              placeholderTextColor={themeColors.placeholderText} // Was #A9A9A9
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
                  placeholderTextColor={themeColors.placeholderText} // Was #A9A9A9
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