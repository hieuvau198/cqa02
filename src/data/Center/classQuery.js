// src/data/Center/classQuery.js
import { db } from "../Firebase/firebase-config";
import { 
  collection, 
  query, 
  where, 
  getDocs,
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

// --- Collection References ---
const YEARS_REF = collection(db, "cqa02", "app_data", "years");
const TERMS_REF = collection(db, "cqa02", "app_data", "terms");
const CLASSES_REF = collection(db, "cqa02", "app_data", "classes");
const SLOTS_REF = collection(db, "cqa02", "app_data", "slots");
const ACTIVITIES_REF = collection(db, "cqa02", "app_data", "activities"); // <--- NEW COLLECTION

// Helper for Natural Sort
const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

// ==============================
// 1. OPERATING YEARS CRUD
// ==============================

export const getAllYears = async () => {
  try {
    const snapshot = await getDocs(YEARS_REF);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
  } catch (error) {
    console.error("Error fetching years:", error);
    return [];
  }
};

export const addYear = async (name) => {
  try {
    await addDoc(YEARS_REF, { name, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateYear = async (id, data) => {
  try {
    await updateDoc(doc(YEARS_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteYear = async (id) => {
  try {
    await deleteDoc(doc(YEARS_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==============================
// 2. TERMS CRUD
// ==============================

export const getTermsByYear = async (yearId) => {
  try {
    const q = query(TERMS_REF, where("yearId", "==", yearId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort(naturalSort);
  } catch (error) {
    console.error("Error fetching terms:", error);
    return [];
  }
};

export const addTerm = async (name, yearId) => {
  try {
    await addDoc(TERMS_REF, { name, yearId, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateTerm = async (id, data) => {
  try {
    await updateDoc(doc(TERMS_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteTerm = async (id) => {
  try {
    await deleteDoc(doc(TERMS_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==============================
// 3. CLASSES CRUD
// ==============================

export const getClassesByTerm = async (termId) => {
  try {
    const q = query(CLASSES_REF, where("termId", "==", termId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort(naturalSort);
  } catch (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
};

export const addClass = async (name, termId) => {
  try {
    await addDoc(CLASSES_REF, { name, termId, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateClass = async (id, data) => {
  try {
    await updateDoc(doc(CLASSES_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteClass = async (id) => {
  try {
    await deleteDoc(doc(CLASSES_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const getClassById = async (id) => {
  try {
    const docRef = doc(CLASSES_REF, id);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) return { id: snapshot.id, ...snapshot.data() };
    return null;
  } catch (error) {
    console.error("Error getting class:", error);
    return null;
  }
};

// ==============================
// 4. SCHEDULE / SLOTS CRUD
// ==============================

export const getSlotsByClass = async (classId) => {
  try {
    const q = query(SLOTS_REF, where("classId", "==", classId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          const timeA = a.startTime || "";
          const timeB = b.startTime || "";
          return timeB.localeCompare(timeA);
      }); 
  } catch (error) {
    console.error("Error fetching slots:", error);
    return [];
  }
};

export const addSlot = async (data) => {
  try {
    await addDoc(SLOTS_REF, { ...data, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateSlot = async (id, data) => {
  try {
    await updateDoc(doc(SLOTS_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteSlot = async (id) => {
  try {
    await deleteDoc(doc(SLOTS_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==============================
// 5. ACTIVITIES CRUD (NEW)
// ==============================

export const getActivitiesBySlot = async (slotId) => {
  try {
    const q = query(ACTIVITIES_REF, where("slotId", "==", slotId));
    const snapshot = await getDocs(q);
    // Sort by createdAt implicitly or name
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }));
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