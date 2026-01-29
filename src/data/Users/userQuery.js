import { db } from "../Firebase/firebase-config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  serverTimestamp 
} from "firebase/firestore";

// Define the Firestore path: cqa02 -> app_data -> users
const USERS_COLLECTION_REF = collection(db, "cqa02", "app_data", "users");

// --- Helper: Find User ---
const findUserByUsername = async (username) => {
  const q = query(USERS_COLLECTION_REF, where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const doc = querySnapshot.docs[0];
  return { id: doc.id, ...doc.data() };
};

// --- Main Feature: Login Logic ---
export const handleLoginLogic = async (username, password) => {
  if (!username || !password) {
    return { success: false, message: "Please enter username and password." };
  }

  try {
    const user = await findUserByUsername(username);

    if (!user) {
      return { success: false, message: "User not found." };
    }

    // Direct plain text comparison (Note: Not secure for production)
    if (user.password !== password) {
      return { success: false, message: "Incorrect password." };
    }

    // Return user without the password field
    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
    
  } catch (error) {
    console.error("Login Error:", error);
    return { success: false, message: "Network error. Try again." };
  }
};

// --- Main Feature: Register Logic ---
export const handleRegisterLogic = async (name, username, password, role) => {
  if (!name || !username || !password || !role) {
    return { success: false, message: "All fields are required." };
  }

  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) {
      return { success: false, message: "Username already taken." };
    }

    const newUser = {
      name,
      username,
      password, // Stored as plain text per request
      role,
      createdAt: serverTimestamp()
    };

    await addDoc(USERS_COLLECTION_REF, newUser);
    return { success: true };
  } catch (error) {
    console.error("Register Error:", error);
    return { success: false, message: "Registration failed. Try again." };
  }
};