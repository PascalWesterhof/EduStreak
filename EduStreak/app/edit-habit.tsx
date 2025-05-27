import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { auth, db } from '../config/firebase';
import { Habit } from '../types';

export default function EditHabitScreen() {
  const router = useRouter();
  const { habitId: routeHabitId } = useLocalSearchParams<{ habitId: string }>();
  const currentUserId = auth.currentUser?.uid;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly'>('daily');
  const [timesPerDay, setTimesPerDay] = useState('1');
  const [timesPerWeek, setTimesPerWeek] = useState('1');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!routeHabitId || !currentUserId) {
      Alert.alert("Error", "Habit ID or User ID is missing for fetching.");
      if(router.canGoBack()) router.back(); else router.replace('/(tabs)');
      return;
    }
    setIsLoading(true);
    const fetchHabitDetails = async () => {
      try {
        console.log(`Fetching details for edit: userId=${currentUserId}, habitId=${routeHabitId}`);
        const habitDocRef = doc(db, 'users', currentUserId, 'habits', routeHabitId as string);
        const docSnap = await getDoc(habitDocRef);
        if (docSnap.exists()) {
          const habitData = docSnap.data() as Omit<Habit, 'id'>;
          console.log("Fetched data for edit:", habitData);
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
        } else {
          Alert.alert("Error", "Habit not found for editing.");
          if(router.canGoBack()) router.back(); else router.replace('/(tabs)');
        }
      } catch (e) {
        console.error("Error fetching habit for editing: ", e);
        Alert.alert("Error", "Could not load habit details for editing.");
        if(router.canGoBack()) router.back(); else router.replace('/(tabs)');
      } finally {
        setIsLoading(false);
      }
    };
    fetchHabitDetails();
  }, [routeHabitId, currentUserId, router]);

  const handleUpdateHabit = async () => {
    console.log("handleUpdateHabit called");
    console.log(`Attempting to save with routeHabitId: ${routeHabitId}, currentUserId: ${currentUserId}`);
    console.log(`Current form state - Name: ${name}, Desc: ${description}, Notes: ${notes}`);
    
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
      if (isNaN(times) || times < 0) { // Allow 0 times per week
        Alert.alert("Validation Error", 'Please enter a valid number of times per week (0 or more).');
        return;
      }
      if (selectedDays.length === 0 && times > 0) { 
        Alert.alert("Validation Error", 'Please select at least one day for weekly frequency when times > 0.');
        return;
      }
      frequency = { type: 'weekly', times, days: selectedDays.sort((a, b) => a - b) };
    }

    const updatedHabitData = {
      name: name.trim(),
      description: description.trim(),
      frequency,
      notes: notes.trim(),
    };
    console.log("Data being sent to Firestore for update:", updatedHabitData);

    setIsSaving(true);
    try {
      const habitDocRef = doc(db, 'users', currentUserId, 'habits', routeHabitId as string);
      await updateDoc(habitDocRef, updatedHabitData);
      console.log("Firestore updateDoc successful");
      Alert.alert("Success", "Habit updated successfully!");
      if(router.canGoBack()) {
        router.back(); // This might show stale data on HabitDetailScreen if it doesn't refetch
      } else {
        router.replace('/(tabs)');
      }
    } catch (e) {
      console.error("Error updating habit in Firestore: ", e);
      Alert.alert("Error", "Failed to update habit. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Edit Habit</Text>
      
      <Text style={styles.label}>Habit Name:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="e.g., Drink Water" />

      <Text style={styles.label}>Description (Optional):</Text>
      <TextInput style={styles.input} value={description} onChangeText={setDescription} placeholder="e.g., Stay hydrated" multiline />

      <Text style={styles.label}>Frequency Type:</Text>
      <View style={styles.switchContainer}>
        <Button title="Daily" onPress={() => setFrequencyType('daily')} color={frequencyType === 'daily' ? '#4CAF50' : 'gray'} />
        <Button title="Weekly" onPress={() => setFrequencyType('weekly')} color={frequencyType === 'weekly' ? '#4CAF50' : 'gray'} />
      </View>

      {frequencyType === 'daily' && (
        <>
          <Text style={styles.label}>Times per day:</Text>
          <TextInput style={styles.input} value={timesPerDay} onChangeText={setTimesPerDay} keyboardType="numeric" />
        </>
      )}

      {frequencyType === 'weekly' && (
        <>
          <Text style={styles.label}>Times per week:</Text>
          <TextInput style={styles.input} value={timesPerWeek} onChangeText={setTimesPerWeek} keyboardType="numeric" />
          <Text style={styles.label}>Select Days:</Text>
          <View style={styles.daysContainer}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName, index) => (
              <Button key={index} title={dayName} onPress={() => toggleDay(index)} color={selectedDays.includes(index) ? '#4CAF50' : 'gray'} />
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Notes (Optional):</Text>
      <TextInput style={[styles.input, styles.notesInput]} value={notes} onChangeText={setNotes} placeholder="Any extra details or reminders" multiline />

      <View style={styles.buttonRow}>
        <Button title={isSaving ? "Saving..." : "Save Changes"} onPress={handleUpdateHabit} disabled={isSaving} />
        <Button title="Cancel" onPress={() => {if(router.canGoBack()) router.back(); else router.replace('/(tabs)');}} color="#f44336" disabled={isSaving} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  contentContainer: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
    backgroundColor: '#fff',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  dayButton: {
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
  }
}); 