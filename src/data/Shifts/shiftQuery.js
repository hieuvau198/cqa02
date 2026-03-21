// src/data/Shifts/shiftQuery.js
import { db } from "../Firebase/firebase-config";
import { 
  collection, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp 
} from "firebase/firestore";

const SHIFTS_COLLECTION_REF = collection(db, "cqa02", "app_data", "shifts");

export const getAllShifts = async () => {
  try {
    const querySnapshot = await getDocs(SHIFTS_COLLECTION_REF);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return [];
  }
};

export const addShift = async (shiftData) => {
  try {
    const docRef = await addDoc(SHIFTS_COLLECTION_REF, { 
      ...shiftData, 
      createdAt: serverTimestamp() 
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error adding shift:", error);
    return { success: false, message: "Add failed." };
  }
};

export const updateShift = async (id, updatedData) => {
  try {
    const shiftDocRef = doc(db, "cqa02", "app_data", "shifts", id);
    await updateDoc(shiftDocRef, updatedData);
    return { success: true };
  } catch (error) {
    console.error("Error updating shift:", error);
    return { success: false, message: "Update failed." };
  }
};

export const deleteShift = async (id) => {
  try {
    const shiftDocRef = doc(db, "cqa02", "app_data", "shifts", id);
    await deleteDoc(shiftDocRef);
    return { success: true };
  } catch (error) {
    console.error("Error deleting shift:", error);
    return { success: false, message: "Delete failed." };
  }
};