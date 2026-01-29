// src/data/Center/classMember.js
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
import { handleRegisterLogic, updateUser, getAllUsers } from "../Users/userQuery"; 

// Helper for Natural Sort
const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

// ==============================
// CLASS MEMBERS (STUDENTS) CRUD
// ==============================

/**
 * Fetch all students in a specific class.
 * Merges data from the 'Relation' (status, joinedAt) and 'User' (profile, parent, school).
 */
export const getClassMembers = async (classId) => {
  try {
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    const snapshot = await getDocs(studentsRef);
    
    const students = await Promise.all(snapshot.docs.map(async (relationDoc) => {
        const relationData = relationDoc.data();
        const userId = relationData.userId;
        
        // Fetch User Profile
        const userRef = doc(db, "cqa02", "app_data", "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { 
                id: userId, 
                ...userSnap.data(), // User Profile (Name, Parent, School, etc.)
                relationId: relationDoc.id,
                status: relationData.status || 'Đang học', // Default status from Relation
                joinedAt: relationData.joinedAt
            };
        }
        return null; 
    }));
    
    return students.filter(s => s !== null).sort(naturalSort);
  } catch (error) {
    console.error("Error fetching class members:", error);
    return [];
  }
};

/**
 * Get all users with role 'Student' who can be added to a class.
 */
export const getStudentCandidates = async () => {
    const allUsers = await getAllUsers();
    return allUsers.filter(u => u.role === 'Student').sort(naturalSort);
};

/**
 * Add a BRAND NEW student to the system and this class.
 * 1. Creates User Account (Auth)
 * 2. Updates User Profile (Parent, School, Address)
 * 3. Creates Class Relation (Status)
 */
export const addMemberNew = async (classId, data) => {
  try {
    // 1. Create Base User
    const authResult = await handleRegisterLogic(
        data.name, 
        data.username, 
        data.password, 
        'Student'
    );
    
    if (!authResult.success) return authResult;
    const newUserId = authResult.id;

    // 2. Update Extended Profile
    const profileData = {
        parentName: data.parentName || '',
        parentPhone: data.parentPhone || '',
        address: data.address || '',
        officialSchool: data.officialSchool || ''
    };
    await updateUser(newUserId, profileData);

    // 3. Add to Class with Status
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    await addDoc(studentsRef, { 
        userId: newUserId, 
        status: data.status || 'Đang học',
        joinedAt: serverTimestamp() 
    });

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Add an EXISTING student to this class.
 * Checks if already in class, then adds relation.
 */
export const addMemberExisting = async (classId, userId, initialStatus = 'Đang học') => {
    try {
        const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
        const q = query(studentsRef, where("userId", "==", userId));
        const snap = await getDocs(q);
        
        if (!snap.empty) return { success: false, message: "Học sinh đã có trong lớp này" };
        
        await addDoc(studentsRef, { 
            userId: userId, 
            status: initialStatus,
            joinedAt: serverTimestamp() 
        });
        
        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
}

/**
 * Update a student's info.
 * - Updates User Profile (Global)
 * - Updates Class Status (Local to Class)
 */
export const updateMember = async (classId, userId, relationId, data) => {
    try {
        // 1. Separate Data
        const { status, ...profileData } = data;

        // 2. Update User Profile (Parent, School, etc.)
        if (Object.keys(profileData).length > 0) {
            await updateUser(userId, profileData);
        }

        // 3. Update Class Status (if changed)
        if (status && relationId) {
            const relationRef = doc(db, "cqa02", "app_data", "classes", classId, "students", relationId);
            await updateDoc(relationRef, { status });
        }

        return { success: true };
    } catch (error) {
        return { success: false, message: error.message };
    }
};

/**
 * Remove a student from the class (Delete Relation only).
 */
export const deleteMember = async (classId, relationId) => {
  try {
    if (relationId) {
         await deleteDoc(doc(db, "cqa02", "app_data", "classes", classId, "students", relationId));
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};