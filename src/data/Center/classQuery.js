import { db } from "../Firebase/firebase-config";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { getCache, setCache, clearCache } from "../cacheHelper";

const YEARS_REF = collection(db, "cqa02", "app_data", "years");
const TERMS_REF = collection(db, "cqa02", "app_data", "terms");
const CLASSES_REF = collection(db, "cqa02", "app_data", "classes");
const SLOTS_REF = collection(db, "cqa02", "app_data", "slots");

const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

export const getAllYears = async () => {
  const cacheKey = "years";
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await getDocs(YEARS_REF);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.name.localeCompare(a.name, undefined, { numeric: true }));
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    return [];
  }
};

export const addYear = async (name) => {
  try {
    await addDoc(YEARS_REF, { name, createdAt: serverTimestamp() });
    clearCache("years");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const updateYear = async (id, data) => {
  try {
    await updateDoc(doc(YEARS_REF, id), data);
    clearCache("years");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const deleteYear = async (id) => {
  try {
    await deleteDoc(doc(YEARS_REF, id));
    clearCache("years");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const getTermsByYear = async (yearId) => {
  const cacheKey = `terms_${yearId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const q = query(TERMS_REF, where("yearId", "==", yearId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(naturalSort);
    setCache(cacheKey, data);
    return data;
  } catch (error) { return []; }
};

export const addTerm = async (name, yearId) => {
  try {
    await addDoc(TERMS_REF, { name, yearId, createdAt: serverTimestamp() });
    clearCache("terms_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const updateTerm = async (id, data) => {
  try {
    await updateDoc(doc(TERMS_REF, id), data);
    clearCache("terms_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const deleteTerm = async (id) => {
  try {
    await deleteDoc(doc(TERMS_REF, id));
    clearCache("terms_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const getClassesByTerm = async (termId) => {
  const cacheKey = `classes_${termId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const q = query(CLASSES_REF, where("termId", "==", termId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort(naturalSort);
    setCache(cacheKey, data);
    return data;
  } catch (error) { return []; }
};

export const addClass = async (data, termId) => {
  try {
    await addDoc(CLASSES_REF, { ...data, termId, createdAt: serverTimestamp() });
    clearCache("classes_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const updateClass = async (id, data) => {
  try {
    await updateDoc(doc(CLASSES_REF, id), data);
    clearCache("classes_");
    clearCache(`class_${id}`);
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const deleteClass = async (id) => {
  try {
    await deleteDoc(doc(CLASSES_REF, id));
    clearCache("classes_");
    clearCache(`class_${id}`);
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const getClassById = async (id) => {
  const cacheKey = `class_${id}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const snapshot = await getDoc(doc(CLASSES_REF, id));
    if (snapshot.exists()) {
      const data = { id: snapshot.id, ...snapshot.data() };
      setCache(cacheKey, data);
      return data;
    }
    return null;
  } catch (error) { return null; }
};

export const getSlotsByClass = async (classId) => {
  const cacheKey = `slots_${classId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const q = query(SLOTS_REF, where("classId", "==", classId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          return (b.startTime || "").localeCompare(a.startTime || "");
      }); 
    setCache(cacheKey, data);
    return data;
  } catch (error) { return []; }
};

export const addSlot = async (data) => {
  try {
    await addDoc(SLOTS_REF, { ...data, createdAt: serverTimestamp() });
    clearCache("slots_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const updateSlot = async (id, data) => {
  try {
    await updateDoc(doc(SLOTS_REF, id), data);
    clearCache("slots_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const deleteSlot = async (id) => {
  try {
    await deleteDoc(doc(SLOTS_REF, id));
    clearCache("slots_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};