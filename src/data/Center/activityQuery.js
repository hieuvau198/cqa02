import { db } from "../Firebase/firebase-config";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { getCache, setCache, clearCache } from "../cacheHelper";

const ACTIVITIES_REF = collection(db, "cqa02", "app_data", "activities");

export const getActivitiesBySlot = async (slotId) => {
  const cacheKey = `activities_slot_${slotId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const q = query(ACTIVITIES_REF, where("slotId", "==", slotId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    return [];
  }
};

export const getActivitiesBySection = async (sectionId) => {
  const cacheKey = `activities_section_${sectionId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const q = query(ACTIVITIES_REF, where("sectionId", "==", sectionId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    return [];
  }
};

export const addActivity = async (data) => {
  try {
    await addDoc(ACTIVITIES_REF, { ...data, createdAt: serverTimestamp() });
    clearCache("activities_"); 
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateActivity = async (id, data) => {
  try {
    await updateDoc(doc(ACTIVITIES_REF, id), data);
    clearCache("activities_"); 
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteActivity = async (id) => {
  try {
    await deleteDoc(doc(ACTIVITIES_REF, id));
    clearCache("activities_"); 
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};