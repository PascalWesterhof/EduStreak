/**
 * @file authService.ts
 * @description This service handles all authentication-related functionalities.
 * It provides a layer of abstraction over the Firebase Authentication library,
 * combining Firebase Auth operations with corresponding Firestore document management.
 * This ensures that when a user is created, signed in, or updated via authentication,
 * their data in the Firestore database remains consistent.
 */

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  deleteUser as firebaseDeleteUser,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile
} from 'firebase/auth';
import { DocumentData, DocumentReference, doc, deleteDoc as firestoreDeleteDoc, getDoc, setDoc } from 'firebase/firestore';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';

// The Google Sign-In configuration is now handled in config/firebase.js
// to ensure it's configured only once at app startup.

/**
 * Ensures a user document exists in Firestore for a given authenticated user.
 * 
 * This function is critical for maintaining data consistency. After a user signs in,
 * this function checks if a corresponding document for them exists in the 'users'
 * collection in Firestore. If it doesn't (e.g., for a first-time Google sign-in),
 * it creates a new document with a default structure.
 * 
 * @param user The Firebase User object from an authentication event (e.g., after sign-in).
 * @throws Throws an error if the Firestore read/write operation fails, allowing the
 *         calling function to handle the UI feedback (e.g., show an error message).
 */
export const ensureUserDocument = async (user: User): Promise<void> => {
  if (!user) {
    console.warn("[AuthService] ensureUserDocument called with no user.");
    return;
  }
  const userDocRef: DocumentReference<DocumentData> = doc(db, "users", user.uid);
  try {
    const userDocSnap = await getDoc(userDocRef);
    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: user.displayName || user.email || "Anonymous User",
        email: user.email,
        photoURL: user.photoURL || null,
        points: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletionDate: null,
        bio: '' 
      });
      console.log("[AuthService] Firestore user document created for:", user.uid);
    }
  } catch (error) {
    console.error("[AuthService] Error in ensureUserDocument:", error);
    throw new Error("Could not ensure user profile data in Firestore."); 
  }
};

/**
 * Signs in a user with their email and password using Firebase Authentication.
 * This is a straightforward wrapper around Firebase's `signInWithEmailAndPassword`.
 * 
 * @param emailIn The user's email address.
 * @param passwordIn The user's password.
 * @returns A Promise that resolves with the Firebase User object upon successful authentication.
 * @throws Throws an error if sign-in fails (e.g., wrong password, user not found, network error).
 *         The error is a Firebase error object, which can be inspected for a specific error code.
 */
export const signInWithEmail = async (emailIn: string, passwordIn: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailIn, passwordIn);
    console.log("[AuthService] User signed in with email:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("[AuthService] Error in signInWithEmail:", error);
    throw error; 
  }
};

/**
 * Handles Google Sign-In for both web and native platforms using Firebase Authentication.
 * This function abstracts the platform-specific differences for Google Sign-In.
 * After a successful sign-in, it calls `ensureUserDocument` to create a Firestore
 * profile if one doesn't already exist.
 * 
 * @returns A Promise that resolves with the Firebase User object upon successful authentication.
 * @throws Throws an error if the Google Sign-In process fails at any step, from getting the
 *         token to authenticating with Firebase.
 */
export const signInWithGoogle = async (): Promise<User> => {
  try {
    let userToReturn: User;
    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      userToReturn = result.user;
      console.log("[AuthService] Google Sign-In (Web) successful for user:", userToReturn.uid);
    } else {
      await GoogleSignin.hasPlayServices();
      const signInResult = await GoogleSignin.signIn();
      const idToken = (signInResult as any).idToken || (signInResult as any).data?.idToken;

      if (idToken) {
        const googleCredential = GoogleAuthProvider.credential(idToken);
        const result = await signInWithCredential(auth, googleCredential);
        userToReturn = result.user;
        console.log("[AuthService] Google Sign-In (Native) successful for user:", userToReturn.uid);
      } else {
        console.log("[AuthService] Full sign-in object:", JSON.stringify(signInResult, null, 2));
        throw new Error('Google Sign-In native: No ID token present in Google User Info.');
      }
    }
    await ensureUserDocument(userToReturn); 
    return userToReturn;
  } catch (error: any) {
    console.error("[AuthService] Error in signInWithGoogle:", error);
    throw error; 
  }
};

/**
 * Registers a new user with email, password, and display name.
 * This is a multi-step process:
 * 1. Create the user in Firebase Authentication.
 * 2. Update the user's Auth profile with their display name.
 * 3. Create a corresponding user document in Firestore with initial values.
 * 
 * @param displayNameIn The desired display name for the new user.
 * @param emailIn The new user's email address.
 * @param passwordIn The new user's password (must be at least 6 characters as per Firebase rules).
 * @returns A Promise that resolves with the newly created Firebase User object.
 * @throws Throws an error if registration fails (e.g., email already in use, weak password).
 */
export const registerWithEmail = async (displayNameIn: string, emailIn: string, passwordIn: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailIn, passwordIn);
    const user = userCredential.user;
    console.log("[AuthService] User created with email/password:", user.uid);

    await updateProfile(user, { displayName: displayNameIn });
    console.log("[AuthService] Firebase Auth profile updated for user:", user.uid);
    
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      displayName: displayNameIn, 
      email: user.email,
      photoURL: user.photoURL || null, 
      points: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastCompletionDate: null,
      bio: '' 
    });
    console.log("[AuthService] Firestore user document created upon registration for:", user.uid);

    return user; 
  } catch (error) {
    console.error("[AuthService] Error in registerWithEmail:", error);
    throw error; 
  }
};

/**
 * Sends a password reset email to a given email address via Firebase Authentication.
 * Firebase handles the token generation and email sending.
 * 
 * @param emailIn The email address to send the reset link to.
 * @throws Throws an error if sending the email fails (e.g., user email not found, network issue).
 */
export const resetPassword = async (emailIn: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, emailIn);
    console.log("[AuthService] Password reset email sent to:", emailIn);
  } catch (error) {
    console.error("[AuthService] Error in resetPassword:", error);
    throw error;
  }
};

/**
 * Updates the Firebase Auth profile for a given user (e.g., displayName, photoURL).
 * It is crucial that this function also updates the corresponding fields in the user's
 * Firestore document to maintain data consistency across the application.
 * 
 * @param user The Firebase User object whose profile is to be updated.
 * @param updates An object containing the profile updates, e.g., `{ displayName: 'New Name', photoURL?: 'http://...' }`.
 * @throws Throws an error if the profile update fails in either Firebase Auth or Firestore.
 */
export const updateUserAuthProfile = async (
  user: User, 
  updates: { displayName?: string; photoURL?: string }
): Promise<void> => {
  if (!user) {
    throw new Error("[AuthService] updateUserAuthProfile: User not available.");
  }
  if (!updates || (updates.displayName === undefined && updates.photoURL === undefined)) {
    console.warn("[AuthService] updateUserAuthProfile: No updates provided.");
    return; 
  }
  try {
    await updateProfile(user, updates);
    console.log("[AuthService] User Auth profile updated successfully with:", updates);

    const firestoreUpdates: { displayName?: string; photoURL?: string } = {};
    if (updates.displayName !== undefined) {
        firestoreUpdates.displayName = updates.displayName;
    }
    if (updates.photoURL !== undefined) {
        firestoreUpdates.photoURL = updates.photoURL;
    }

    if (Object.keys(firestoreUpdates).length > 0) {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, firestoreUpdates, { merge: true });
        console.log("[AuthService] User Firestore document updated with:", firestoreUpdates);
    }

  } catch (error) {
    console.error("[AuthService] Error in updateUserAuthProfile:", error);
    throw error; 
  }
};

/**
 * Re-authenticates the current user with their current password.
 * This is a security measure required by Firebase for sensitive operations like
 * changing a password or deleting an account, to ensure the user is who they say they are.
 * 
 * @param user The Firebase User object to re-authenticate.
 * @param currentPasswordInput The user's current password.
 * @throws Throws an error if re-authentication fails (e.g., wrong password, user not found).
 */
export const reauthenticateCurrentUser = async (user: User, currentPasswordInput: string): Promise<void> => {
  if (!user || !user.email) {
    throw new Error("[AuthService] reauthenticateCurrentUser: User or user email not available.");
  }
  try {
    const credential = EmailAuthProvider.credential(user.email, currentPasswordInput);
    await reauthenticateWithCredential(user, credential);
    console.log("[AuthService] User re-authenticated successfully.");
  } catch (error) {
    console.error("[AuthService] Error in reauthenticateCurrentUser:", error);
    throw error; 
  }
};

/**
 * Changes the current user's password in Firebase Authentication.
 * It is assumed that the user has been recently re-authenticated before this function is called.
 * 
 * @param user The Firebase User object whose password is to be changed.
 * @param newPasswordInput The new password (must be at least 6 characters).
 * @throws Throws an error if the password update fails (e.g., weak new password, user not found).
 */
export const changeUserPassword = async (user: User, newPasswordInput: string): Promise<void> => {
  if (!user) {
    throw new Error("[AuthService] changeUserPassword: User not available.");
  }
  try {
    await firebaseUpdatePassword(user, newPasswordInput);
    console.log("[AuthService] User password updated successfully.");
  } catch (error) {
    console.error("[AuthService] Error in changeUserPassword:", error);
    throw error; 
  }
};

/**
 * Deletes a user's account from Firebase Authentication and their document from Firestore.
 * This is a destructive and irreversible operation.
 * 
 * The process is:
 * 1. (Optional but recommended) Re-authenticate the user if they signed up with a password.
 * 2. Delete their document from the 'users' collection in Firestore.
 * 3. Delete their account from Firebase Authentication.
 * 
 * @param user The Firebase User object to delete.
 * @param currentPasswordInput Optional. The user's current password for re-authentication.
 *        This is only necessary for users who signed up with email/password.
 * @throws Throws an error if any step of the deletion process fails.
 */
export const deleteUserAccount = async (user: User, currentPasswordInput?: string): Promise<void> => {
  if (!user) {
    throw new Error("[AuthService] deleteUserAccount: User not available.");
  }

  const userIdToDelete = user.uid;

  try {
    if (currentPasswordInput && user.email) {
      const isPasswordProvider = user.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID);
      if (isPasswordProvider) {
          await reauthenticateCurrentUser(user, currentPasswordInput);
          console.log("[AuthService] User re-authenticated successfully for deletion.");
      } else {
          console.warn("[AuthService] Password provided for deletion, but user is not a password provider. Skipping re-authentication step in service.");
      }
    }

    try {
      const userDocRef = doc(db, "users", userIdToDelete);
      await firestoreDeleteDoc(userDocRef);
      console.log(`[AuthService] Firestore document for user ${userIdToDelete} deleted.`);
    } catch (firestoreError) {
      console.error("[AuthService] Error deleting Firestore document during account deletion:", firestoreError);
    }

    await firebaseDeleteUser(user);
    console.log("[AuthService] Firebase Auth user deleted successfully:", userIdToDelete);

  } catch (error) {
    console.error("[AuthService] Error in deleteUserAccount:", error);
    throw error; 
  }
}; 