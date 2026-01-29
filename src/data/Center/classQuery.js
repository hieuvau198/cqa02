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
import { handleRegisterLogic, updateUser, deleteUser } from "../Users/userQuery"; // Import User Logic

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

// ==============================
// 4. STUDENT IN CLASS LOGIC
// ==============================

// Get Class Details
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

// Get All Students in a Class
export const getStudentsInClass = async (classId) => {
  try {
    // Reference to the subcollection storing the link
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    const snapshot = await getDocs(studentsRef);
    
    // Fetch full user details for each student linked
    const students = await Promise.all(snapshot.docs.map(async (relationDoc) => {
        const userId = relationDoc.data().userId;
        const userRef = doc(db, "cqa02", "app_data", "users", userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { 
                id: userId, 
                ...userSnap.data(), 
                relationId: relationDoc.id // Keep track of the link ID for deletion
            };
        }
        return null; // User might have been deleted manually
    }));
    
    return students.filter(s => s !== null);
  } catch (error) {
    console.error("Error fetching class students:", error);
    return [];
  }
};

// Add New Student to Class (Creates User + Creates Link)
export const addStudentToClass = async (classId, studentData) => {
  try {
    // 1. Create the User account (Role is 'Student')
    const result = await handleRegisterLogic(
        studentData.name, 
        studentData.username, 
        studentData.password, 
        'Student'
    );
    
    if (!result.success) return result;
    
    const newUserId = result.id;
    
    // 2. Link User to Class in subcollection
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    await addDoc(studentsRef, { 
        userId: newUserId, 
        joinedAt: serverTimestamp() 
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Update Student (Wraps user update)
export const updateStudentInClass = async (userId, data) => {
    return await updateUser(userId, data);
};

// Delete Student from Class (Removes Link + Deletes User Account)
export const deleteStudentFromClass = async (classId, userId, relationId) => {
  try {
    // 1. Delete the link in class
    if (relationId) {
         await deleteDoc(doc(db, "cqa02", "app_data", "classes", classId, "students", relationId));
    }
    
    // 2. Delete the User account
    await deleteUser(userId);
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};