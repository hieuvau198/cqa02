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

// Helper for Natural Sort (e.g. handles "Term 1", "Term 2", "Term 10" correctly)
const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

// ==============================
// 1. OPERATING YEARS CRUD
// ==============================

export const getAllYears = async () => {
  try {
    const snapshot = await getDocs(YEARS_REF);
    // Sort descending (2025, 2024...)
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
// 2. TERMS CRUD (Linked to Year)
// ==============================

export const getTermsByYear = async (yearId) => {
  try {
    const q = query(TERMS_REF, where("yearId", "==", yearId));
    const snapshot = await getDocs(q);
    // Sort ascending (Thang 1, Thang 2...)
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
// 3. CLASSES CRUD (Linked to Term)
// ==============================

export const getClassesByTerm = async (termId) => {
  try {
    const q = query(CLASSES_REF, where("termId", "==", termId));
    const snapshot = await getDocs(q);
    // Sort ascending (Class 1, Class 2...)
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
    
    // Filter nulls and Sort by Name Ascending
    return students
        .filter(s => s !== null)
        .sort(naturalSort);
        
  } catch (error) {
    console.error("Error fetching class students:", error);
    return [];
  }
};

// Helper: Get all potential students for the dropdown
export const getAllStudentCandidates = async () => {
    const allUsers = await getAllUsers();
    // Filter only those with role 'Student'
    return allUsers.filter(u => u.role === 'Student').sort(naturalSort);
};

// OPTION A: Add NEW Student (Create User + Link)
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
    
    // Link User to Class
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

// OPTION B: Add EXISTING Student (Link Only)
export const addExistingStudentToClass = async (classId, userId) => {
    try {
        const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
        
        // Check duplication (optional but recommended)
        const q = query(studentsRef, where("userId", "==", userId));
        const snap = await getDocs(q);
        if (!snap.empty) {
            return { success: false, message: "Student already in this class" };
        }

        await addDoc(studentsRef, { 
            userId: userId, 
            joinedAt: serverTimestamp() 
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// Update Student info
export const updateStudentInClass = async (userId, data) => {
    return await updateUser(userId, data);
};

// Delete Student from Class (ONLY REMOVES LINK, KEEPS USER ACCOUNT)
export const deleteStudentFromClass = async (classId, userId, relationId) => {
  try {
    if (relationId) {
         await deleteDoc(doc(db, "cqa02", "app_data", "classes", classId, "students", relationId));
    }
    // CHANGED: We DO NOT delete the user account anymore.
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};