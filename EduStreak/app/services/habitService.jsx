// Import Firestore database reference and necessary functions
import { db } from '../../firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

/*
  Adds a new habit for a user in Firestore.

  @param {string} userId - The user's unique ID.
  @param {string} habitId - A unique identifier for the habit.
  @param {string} name - The name of the habit.
 */
export const addHabit = async (userId, habitId, name) => {
  const habitRef = doc(db, 'users', userId, 'habits', habitId); // Reference to the user's habit document
  await setDoc(habitRef, {
    name,                             // Habit name
    createdAt: new Date().toISOString(), // Creation timestamp
    completions: {},                  // Empty object to track completed dates
  });
};

/*
  Marks a habit as completed for a specific date.

  @param {string} userId - The user's unique ID. d
  @param {string} habitId - The habit's unique ID.
  @param {string} date - The date string (e.g., "2025-05-29").
 */
export const markHabitComplete = async (userId, habitId, date) => {
  const docRef = doc(db, 'users', userId, 'habits', habitId); // Reference to the habit document
  await updateDoc(docRef, {
    [`completions.${date}`]: true, // Set the date key to true under 'completions'
  });
};

/*
  Retrieves a specific habit document for a user.

  @param {string} userId - The user's unique ID.
  @param {string} habitId - The habit's unique ID.
  @returns {Object|null} The habit data or null if not found.
 */
export const getHabit = async (userId, habitId) => {
  const docRef = doc(db, 'users', userId, 'habits', habitId); // Reference to the habit document
  const docSnap = await getDoc(docRef); // Attempt to retrieve the document
  return docSnap.exists() ? docSnap.data() : null; // Return the data or null if not found
};

// Example usage:
// Create a date string in "YYYY-MM-DD" format
const date = new Date().toISOString().split('T')[0]; // e.g., "2025-05-29"
