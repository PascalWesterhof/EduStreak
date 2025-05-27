import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { Habit } from '../types'; // Adjust path as needed
// importDateTimePicker from '@react-native-community/datetimepicker'; // We might need this later for scheduling

interface Props {
  onAddHabit: (newHabit: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt'>) => void;
  onCancel: () => void;
}

export default function AddHabitScreen({ onAddHabit, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [timesPerWeek, setTimesPerWeek] = useState('1');
  // For weekly frequency, an array of numbers [0-6] for Sun-Sat
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');

  const handleAddHabit = () => {
    if (!name.trim()) {
      alert('Please enter a habit name.');
      return;
    }

    const commonDetails = {
        name,
        description,
        notes,
        isDefault: false,
    };

    let newHabitData: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completionHistory' | 'createdAt'>;
    if (frequencyType === 'daily') {
        const times = parseInt(timesPerDay, 10);
        if (isNaN(times) || times <= 0) {
            alert('Please enter a valid number of times per day.');
            return;
        }
        newHabitData = {
            ...commonDetails,
            frequency: { type: 'daily' as 'daily', times },
        };
    } else { // weekly
        const times = parseInt(timesPerWeek, 10);
        if (isNaN(times) || times <= 0) {
            alert('Please enter a valid number of times per week.');
            return;
        }
        if (selectedDays.length === 0) {
            alert('Please select at least one day for weekly frequency.');
            return;
        }
        newHabitData = {
            ...commonDetails,
            frequency: { type: 'weekly' as 'weekly', times, days: selectedDays.sort((a,b) => a-b) },
        };
    }

    onAddHabit(newHabitData);
  };
  
  const toggleDay = (day: number) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add New Habit</Text>
      
      <Text style={styles.label}>Habit Name:</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g., Drink Water"
      />

      <Text style={styles.label}>Description (Optional):</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="e.g., Stay hydrated throughout the day"
        multiline
      />

      <Text style={styles.label}>Frequency Type:</Text>
      <View style={styles.switchContainer}>
        <Button title="Daily" onPress={() => setFrequencyType('daily')} color={frequencyType === 'daily' ? 'blue' : 'gray'} />
        <Button title="Weekly" onPress={() => setFrequencyType('weekly')} color={frequencyType === 'weekly' ? 'blue' : 'gray'} />
      </View>

      {frequencyType === 'daily' && (
        <>
          <Text style={styles.label}>Times per day:</Text>
          <TextInput
            style={styles.input}
            value={timesPerDay}
            onChangeText={setTimesPerDay}
            placeholder="e.g., 2"
            keyboardType="numeric"
          />
        </>
      )}

      {frequencyType === 'weekly' && (
        <>
          <Text style={styles.label}>Times per week:</Text>
          <TextInput
            style={styles.input}
            value={timesPerWeek}
            onChangeText={setTimesPerWeek}
            placeholder="e.g., 3"
            keyboardType="numeric"
          />
          <Text style={styles.label}>Select Days:</Text>
          <View style={styles.daysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
              <Button 
                key={index} 
                title={dayName} 
                onPress={() => toggleDay(index)} 
                color={selectedDays.includes(index) ? 'blue' : 'gray'}
              />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Notes (Optional):</Text>
      <TextInput
        style={[styles.input, styles.notesInput]}
        value={notes}
        onChangeText={setNotes}
        placeholder="Any extra details or reminders"
        multiline
      />

      <View style={styles.buttonRow}>
        <Button title="Add Habit" onPress={handleAddHabit} />
        <Button title="Cancel" onPress={onCancel} color="red" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginTop: 15,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top', // For Android multiline
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allow buttons to wrap to next line
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  }
}); 