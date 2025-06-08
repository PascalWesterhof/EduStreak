import { db } from "../config/firebase";
import { collection, addDoc, doc, updateDoc, getDoc, getDocs, query, where, arrayUnion } from "firebase/firestore";

// Create a group
export const createGroup = async (userId: string, name: string, description: string) => {
  const groupRef = await addDoc(collection(db, "groups"), {
    name,
    description,
    createdBy: userId,
    members: [userId],
    createdAt: new Date(),
  });

  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    userGroups: arrayUnion(groupRef.id),
  });

  return groupRef.id;
};

// Get all groups
export const getAllGroups = async () => {
  const snapshot = await getDocs(collection(db, "groups"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Get user's joined group IDs
export const getUserGroups = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);
  const userData = userSnap.data();
  return userData?.userGroups || [];
};

// Join a group
export const joinGroup = async (userId: string, groupId: string) => {
  const groupRef = doc(db, "groups", groupId);
  const userRef = doc(db, "users", userId);

  await updateDoc(groupRef, {
    members: arrayUnion(userId),
  });

  await updateDoc(userRef, {
    userGroups: arrayUnion(groupId),
  });
};
