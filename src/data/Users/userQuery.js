import { db } from "../Firebase/firebase-config";
import { 
  collection, query, where, getDocs, addDoc, serverTimestamp, doc, updateDoc, deleteDoc 
} from "firebase/firestore";
import { getCache, setCache, clearCache } from "../cacheHelper";

const USERS_COLLECTION_REF = collection(db, "cqa02", "app_data", "users");

const findUserByUsername = async (username) => {
  const q = query(USERS_COLLECTION_REF, where("username", "==", username));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) return null;
  const docSnap = querySnapshot.docs[0];
  return { id: docSnap.id, ...docSnap.data() };
};

export const handleLoginLogic = async (username, password) => {
  if (!username || !password) return { success: false, message: "Please enter username and password." };

  try {
    const user = await findUserByUsername(username);
    if (!user) return { success: false, message: "User not found." };
    if (user.password !== password) return { success: false, message: "Incorrect password." };

    const { password: _, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error) {
    return { success: false, message: "Network error. Try again." };
  }
};

export const handleRegisterLogic = async (name, username, password, role, grade = '') => {
  if (!name || !username || !password || !role) return { success: false, message: "All fields are required." };

  try {
    const existingUser = await findUserByUsername(username);
    if (existingUser) return { success: false, message: "Username already taken." };

    const newUser = { name, username, password, role, grade, createdAt: serverTimestamp() };
    const docRef = await addDoc(USERS_COLLECTION_REF, newUser);
    
    clearCache("all_users"); // Invalidate cache
    return { success: true, id: docRef.id }; 
  } catch (error) {
    return { success: false, message: "Registration failed. Try again." };
  }
};

export const getAllUsers = async () => {
  const cacheKey = "all_users";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const querySnapshot = await getDocs(USERS_COLLECTION_REF);
    const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCache(cacheKey, users);
    return users;
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

export const updateUser = async (id, updatedData) => {
  try {
    const userDocRef = doc(db, "cqa02", "app_data", "users", id);
    await updateDoc(userDocRef, updatedData);
    clearCache("all_users"); // Invalidate cache
    return { success: true };
  } catch (error) {
    return { success: false, message: "Update failed." };
  }
};

export const deleteUser = async (id) => {
  try {
    const userDocRef = doc(db, "cqa02", "app_data", "users", id);
    await deleteDoc(userDocRef);
    clearCache("all_users"); // Invalidate cache
    return { success: true };
  } catch (error) {
    return { success: false, message: "Delete failed." };
  }
};