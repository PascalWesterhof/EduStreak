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

// Configure Google Sign In for native platforms if not on web.
// This needs to be done once, typically at app startup, but placing it here
// ensures it's configured before any Google Sign-In attempt via this service.
if (Platform.OS !== 'web') {
  GoogleSignin.configure({
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID, 
  });
}

/**
 * Ensures a user document exists in Firestore. If it doesn't, a new document
 * is created with default values.
 * @param user The Firebase User object from authentication.
 * @throws Throws an error if the Firestore operation fails.
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
 * @param emailIn The user's email address.
 * @param passwordIn The user's password.
 * @returns A Promise that resolves with the Firebase User object upon successful authentication.
 * @throws Throws an error if sign-in fails (e.g., wrong password, user not found).
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
 * It also ensures that a corresponding user document is created in Firestore after successful sign-in.
 * @returns A Promise that resolves with the Firebase User object upon successful authentication.
 * @throws Throws an error if Google Sign-In fails at any step.
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
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.idToken) {
        const googleCredential = GoogleAuthProvider.credential(userInfo.idToken);
        const result = await signInWithCredential(auth, googleCredential);
        userToReturn = result.user;
        console.log("[AuthService] Google Sign-In (Native) successful for user:", userToReturn.uid);
      } else {
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
 * Registers a new user with email, password, and display name using Firebase Authentication.
 * It also updates the user's Firebase Auth profile with the display name and creates
 * a corresponding user document in Firestore with initial values.
 * @param displayNameIn The desired display name for the new user.
 * @param emailIn The new user's email address.
 * @param passwordIn The new user's password (must be at least 6 characters).
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
    
    // Create Firestore document (ensureUserDocument is more for sign-in, this is for new registration)
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
 * Sends a password reset email to the given email address via Firebase Authentication.
 * @param emailIn The email address to send the reset link to.
 * @throws Throws an error if sending the email fails (e.g., user not found, network issue).
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
 * Updates the Firebase Auth profile for the given user (e.g., displayName, photoURL).
 * It also updates the corresponding fields in the user's Firestore document to maintain consistency.
 * @param user The Firebase User object whose profile is to be updated.
 * @param updates An object containing the profile updates, e.g., { displayName: string, photoURL?: string }.
 * @throws Throws an error if the profile update fails in Auth or Firestore.
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

    // Prepare Firestore updates object to only set fields that are actually being updated.
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
 * This is often required for sensitive operations like changing passwords or deleting accounts.
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
 * Assumes the user has been recently re-authenticated if required by Firebase.
 * @param user The Firebase User object whose password is to be changed.
 * @param newPasswordInput The new password (must be at least 6 characters).
 * @throws Throws an error if the password update fails (e.g., weak password, user not found).
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
 * Deletes the user's Firebase Authentication account and their corresponding Firestore document.
 * Attempts re-authentication if a current password is provided (for password-based accounts).
 * @param user The Firebase User object to delete.
 * @param currentPasswordInput Optional. The user's current password for re-authentication if applicable.
 * @throws Throws an error if any step of the deletion process fails.
 */
export const deleteUserAccount = async (user: User, currentPasswordInput?: string): Promise<void> => {
  if (!user) {
    throw new Error("[AuthService] deleteUserAccount: User not available.");
  }

  const userIdToDelete = user.uid;

  try {
    // Step 1: Re-authenticate if password is provided and user is a password provider
    if (currentPasswordInput && user.email) {
      const isPasswordProvider = user.providerData.some(p => p.providerId === EmailAuthProvider.PROVIDER_ID);
      if (isPasswordProvider) {
          await reauthenticateCurrentUser(user, currentPasswordInput);
          console.log("[AuthService] User re-authenticated successfully for deletion.");
      } else {
          // This case should ideally be handled by the calling component (e.g., not asking for a password
          // if the user signed in via Google). If password still provided, log a warning.
          console.warn("[AuthService] Password provided for deletion, but user is not a password provider. Skipping re-authentication step in service.");
      }
    }

    // Step 2: Delete Firestore document
    try {
      const userDocRef = doc(db, "users", userIdToDelete);
      await firestoreDeleteDoc(userDocRef);
      console.log(`[AuthService] Firestore document for user ${userIdToDelete} deleted.`);
    } catch (firestoreError) {
      console.error("[AuthService] Error deleting Firestore document during account deletion:", firestoreError);
      // Optionally, re-throw this as a more specific error to inform the user that only part of the data might be deleted.
      // For now, log and proceed to Auth deletion, as Auth deletion is usually the primary goal for the user.
    }

    // Step 3: Delete Firebase Auth user
    await firebaseDeleteUser(user);
    console.log("[AuthService] Firebase Auth user deleted successfully:", userIdToDelete);

  } catch (error) {
    console.error("[AuthService] Error in deleteUserAccount:", error);
    throw error; 
  }
}; 