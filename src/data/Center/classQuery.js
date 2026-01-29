// src/data/Center/classQuery.js
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

// --- Collection References ---
// Using the same structure pattern as your userQuery: cqa02 -> app_data -> [collection]
const YEARS_REF = collection(db, "cqa02", "app_data", "years");
const TERMS_REF = collection(db, "cqa02", "app_data", "terms");
const CLASSES_REF = collection(db, "cqa02", "app_data", "classes");

// ==============================
// 1. OPERATING YEARS CRUD
// ==============================

export const getAllYears = async () => {
  try {
    const snapshot = await getDocs(YEARS_REF);
    // Sort by name (e.g., 2024-2025) descending typically
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.name.localeCompare(a.name));
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
    // Note: In a real app, you might want to check for existing terms first
    await deleteDoc(doc(YEARS_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==============================
// 2. TERMS CRUD (Linked to Year)
// ==============================

export const getTermsByYear = async (yearId) => {
  try {
    const q = query(TERMS_REF, where("yearId", "==", yearId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
// 3. CLASSES CRUD (Linked to Term)
// ==============================

export const getClassesByTerm = async (termId) => {
  try {
    const q = query(CLASSES_REF, where("termId", "==", termId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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