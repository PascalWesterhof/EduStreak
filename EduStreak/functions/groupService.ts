import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  arrayRemove,
  deleteDoc,
} from "firebase/firestore";

// Create a group
export const createGroup = async (
  userId: string,
  name: string,
  description: string,
  imageUrl?: string
) => {
  // Check for duplicate group name
  const groupQuery = query(collection(db, "groups"), where("name", "==", name));
  const existing = await getDocs(groupQuery);

  if (!existing.empty) {
    throw new Error("A group with this name already exists");
  }

  const groupRef = await addDoc(collection(db, "groups"), {
    name,
    description,
    imageUrl: imageUrl || "",
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
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
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

// Leave a group
export const leaveGroup = async (userId: string, groupId: string) => {
  const groupRef = doc(db, "groups", groupId);
  const userRef = doc(db, "users", userId);

  // Remove user from group members
  await updateDoc(groupRef, {
    members: arrayRemove(userId),
  });

  // Remove group from user's groups
  await updateDoc(userRef, {
    userGroups: arrayRemove(groupId),
  });

  // Check if group has any members left
  const updatedGroupSnap = await getDoc(groupRef);
  const updatedGroupData = updatedGroupSnap.data();

  if (
    !updatedGroupData ||
    !updatedGroupData.members ||
    updatedGroupData.members.length === 0
  ) {
    // No members left, delete the group
    await deleteDoc(groupRef);
  }
};

// Get user details by userId
export const getUserById = async (userId: string) => {
  const userRef = doc(db, "users", userId);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return { id: userSnap.id, ...userSnap.data() };
  } else {
    return null;
  }
};

// Get group members with their user details
export const getGroupMembersWithDetails = async (groupId: string) => {
  const groupRef = doc(db, "groups", groupId);
  const groupSnap = await getDoc(groupRef);

  if (!groupSnap.exists()) return [];

  const groupData = groupSnap.data();
  if (!groupData?.members) return [];

  // members is an array of user IDs
  const members = groupData.members;

  // Fetch user details for each member
  const membersDetails = await Promise.all(
    members.map(async (userId: string) => {
      const user = await getUserById(userId);
      return user;
    })
  );

  // Filter out any nulls (users not found)
  return membersDetails.filter(Boolean);
};
