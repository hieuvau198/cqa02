// src/data/Center/activityQuery.js
import { db } from "../Firebase/firebase-config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const ACTIVITIES_REF = collection(db, "cqa02", "app_data", "activities");

export const getActivitiesBySlot = async (slotId) => {
  try {
    const q = query(ACTIVITIES_REF, where("slotId", "==", slotId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching activities:", error);
    return [];
  }
};

export const addActivity = async (data) => {
  try {
    await addDoc(ACTIVITIES_REF, { ...data, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateActivity = async (id, data) => {
  try {
    await updateDoc(doc(ACTIVITIES_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteActivity = async (id) => {
  try {
    await deleteDoc(doc(ACTIVITIES_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};