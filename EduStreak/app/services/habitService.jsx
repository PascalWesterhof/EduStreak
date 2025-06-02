import { db } from '../../firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

export const addHabit = async (userId, habitId, name) => {
  const habitRef = doc(db, 'users', userId, 'habits', habitId);
  await setDoc(habitRef, {
    name,
    createdAt: new Date().toISOString(),
    completions: {},
  });
};

export const markHabitComplete = async (userId, habitId, date) => {
  const docRef = doc(db, 'users', userId, 'habits', habitId);
  await updateDoc(docRef, {
    [`completions.${date}`]: true,
  });
};

export const getHabit = async (userId, habitId) => {
  const docRef = doc(db, 'users', userId, 'habits', habitId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
};

// Example usage
const date = new Date().toISOString().split('T')[0]; // e.g., "2025-05-29"

