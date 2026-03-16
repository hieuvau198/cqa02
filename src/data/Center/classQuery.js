import { db } from "../Firebase/firebase-config";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
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
    const createdAt = serverTimestamp();
    const newId = generateNewClassId(data.name, new Date()); 
    
    if (newId) {
      await setDoc(doc(CLASSES_REF, newId), { ...data, termId, createdAt });
    } else {
      await addDoc(CLASSES_REF, { ...data, termId, createdAt });
    }
    
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

export const getSlotsByDateFilter = async (startDate, endDate) => {
  // Add Cache logic
  const cacheKey = `slots_date_${startDate}_${endDate || 'single'}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    let q;
    if (endDate) {
      q = query(SLOTS_REF, where("date", ">=", startDate), where("date", "<=", endDate));
    } else {
      q = query(SLOTS_REF, where("date", "==", startDate));
    }
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
      
    setCache(cacheKey, data); // Set cache
    return data;
  } catch (error) {
    console.error("Error fetching slots by date:", error);
    return [];
  }
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

// --- NEW ID GENERATOR ---
export const generateNewClassId = (className, dateObj) => {
  try {
    const year = dateObj ? dateObj.getFullYear() : new Date().getFullYear();
    
    // Parses names like: "Tiếng Anh 6 Tháng 3" or "Toán 8 tháng 4"
    const match = className.match(/^(.*?)\s+(\d+)\s*tháng\s*(\d+)$/i);
    if (!match) return null; // Fallback for unmatched formats
    
    const subject = match[1].trim();
    const grade = match[2];
    const month = match[3];
    
    // Map Subject string to acronym (e.g. "Tiếng Anh" -> "TA", "Toán" -> "T")
    const subjectCode = subject
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('');
      
    return `CL${year}${subjectCode}${grade}T${month}`;
  } catch (error) {
    return null;
  }
};

// --- MIGRATION LOGIC FOR 1 CLASS ---
export const migrateClassId = async (oldClassId) => {
  try {
    const classDoc = await getDoc(doc(CLASSES_REF, oldClassId));
    if (!classDoc.exists()) throw new Error("Class not found");
    
    const classData = classDoc.data();
    const createdDate = classData.createdAt?.toDate ? classData.createdAt.toDate() : new Date();
    const newId = generateNewClassId(classData.name, createdDate);
    
    if (!newId || newId === oldClassId) {
      return { success: false, message: "Invalid name format or ID is already up-to-date." };
    }
    
    const batch = writeBatch(db);
    
    // 1. Recreate class under new ID
    batch.set(doc(CLASSES_REF, newId), classData);
    
    // 2. Delete the old class
    batch.delete(doc(CLASSES_REF, oldClassId));
    
    // 3. Update all Slots referencing this class
    const slotsQ = query(SLOTS_REF, where("classId", "==", oldClassId));
    const slotsSnap = await getDocs(slotsQ);
    slotsSnap.forEach(slotDoc => {
      batch.update(doc(SLOTS_REF, slotDoc.id), { classId: newId });
    });
    
    // 4. Update all Payments referencing this class
    const PAYMENTS_REF = collection(db, "cqa02", "app_data", "payments");
    const paymentsQ = query(PAYMENTS_REF, where("classId", "==", oldClassId));
    const paymentsSnap = await getDocs(paymentsQ);
    paymentsSnap.forEach(payDoc => {
      batch.update(doc(PAYMENTS_REF, payDoc.id), { classId: newId });
    });
    
    await batch.commit();
    
    // Clean cache
    clearCache("classes_");
    clearCache(`class_${oldClassId}`);
    clearCache(`slots_${oldClassId}`);
    clearCache(`payments_${oldClassId}`);
    
    return { success: true, newId, oldId: oldClassId };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// --- MIGRATION LOGIC FOR ALL CLASSES ---
export const migrateAllClasses = async () => {
  try {
    const snapshot = await getDocs(CLASSES_REF);
    let count = 0;
    
    for (const classDoc of snapshot.docs) {
      const classData = classDoc.data();
      const createdDate = classData.createdAt?.toDate ? classData.createdAt.toDate() : new Date();
      const newId = generateNewClassId(classData.name, createdDate);
      
      if (newId && newId !== classDoc.id) {
        await migrateClassId(classDoc.id);
        count++;
      }
    }
    return { success: true, count };
  } catch (error) {
    return { success: false, message: error.message };
  }
};