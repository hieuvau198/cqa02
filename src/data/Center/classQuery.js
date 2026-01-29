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
import { handleRegisterLogic, updateUser, deleteUser, getAllUsers } from "../Users/userQuery"; 

// --- Collection References ---
const YEARS_REF = collection(db, "cqa02", "app_data", "years");
const TERMS_REF = collection(db, "cqa02", "app_data", "terms");
const CLASSES_REF = collection(db, "cqa02", "app_data", "classes");
const SLOTS_REF = collection(db, "cqa02", "app_data", "slots");

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

// ==============================
// 4. STUDENT IN CLASS LOGIC
// ==============================

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

export const getStudentsInClass = async (classId) => {
  try {
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    const snapshot = await getDocs(studentsRef);
    
    const students = await Promise.all(snapshot.docs.map(async (relationDoc) => {
        const userId = relationDoc.data().userId;
        const userRef = doc(db, "cqa02", "app_data", "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { 
                id: userId, 
                ...userSnap.data(), 
                relationId: relationDoc.id 
            };
        }
        return null; 
    }));
    
    return students.filter(s => s !== null).sort(naturalSort);
  } catch (error) {
    console.error("Error fetching class students:", error);
    return [];
  }
};

export const getAllStudentCandidates = async () => {
    const allUsers = await getAllUsers();
    return allUsers.filter(u => u.role === 'Student').sort(naturalSort);
};

export const addStudentToClass = async (classId, studentData) => {
  try {
    const result = await handleRegisterLogic(
        studentData.name, 
        studentData.username, 
        studentData.password, 
        'Student'
    );
    if (!result.success) return result;
    const newUserId = result.id;
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    await addDoc(studentsRef, { userId: newUserId, joinedAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const addExistingStudentToClass = async (classId, userId) => {
    try {
        const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
        const q = query(studentsRef, where("userId", "==", userId));
        const snap = await getDocs(q);
        if (!snap.empty) return { success: false, message: "Student already in this class" };
        await addDoc(studentsRef, { userId: userId, joinedAt: serverTimestamp() });
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

export const updateStudentInClass = async (userId, data) => {
    return await updateUser(userId, data);
};

export const deleteStudentFromClass = async (classId, userId, relationId) => {
  try {
    if (relationId) {
         await deleteDoc(doc(db, "cqa02", "app_data", "classes", classId, "students", relationId));
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// ==============================
// 5. SCHEDULE / SLOTS CRUD
// ==============================

// Fetch all slots for a specific class
export const getSlotsByClass = async (classId) => {
  try {
    const q = query(SLOTS_REF, where("classId", "==", classId));
    const snapshot = await getDocs(q);
    
    // Sort by Date Descending, then by Start Time Descending
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => {
          const dateDiff = b.date.localeCompare(a.date);
          if (dateDiff !== 0) return dateDiff;
          
          // If dates are equal, sort by start time (if exists)
          const timeA = a.startTime || "";
          const timeB = b.startTime || "";
          return timeB.localeCompare(timeA);
      }); 
  } catch (error) {
    console.error("Error fetching slots:", error);
    return [];
  }
};

// Add a new slot
export const addSlot = async (data) => {
  try {
    await addDoc(SLOTS_REF, { ...data, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Update a slot
export const updateSlot = async (id, data) => {
  try {
    await updateDoc(doc(SLOTS_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Delete a slot
export const deleteSlot = async (id) => {
  try {
    await deleteDoc(doc(SLOTS_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};