import { db } from "../Firebase/firebase-config";
import { collection, query, where, getDocs, getDoc, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { handleRegisterLogic, updateUser, getAllUsers } from "../Users/userQuery"; 
import { getCache, setCache, clearCache } from "../cacheHelper";

const naturalSort = (a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });

export const getClassMembers = async (classId) => {
  const cacheKey = `class_members_${classId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    const snapshot = await getDocs(studentsRef);
    
    const students = await Promise.all(snapshot.docs.map(async (relationDoc) => {
        const relationData = relationDoc.data();
        const userRef = doc(db, "cqa02", "app_data", "users", relationData.userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            return { 
                id: relationData.userId, 
                ...userSnap.data(),
                relationId: relationDoc.id,
                status: relationData.status || 'Đang học',
                joinedAt: relationData.joinedAt
            };
        }
        return null; 
    }));
    
    const data = students.filter(s => s !== null).sort(naturalSort);
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    return [];
  }
};

export const getStudentCandidates = async () => {
    // Relying on getAllUsers cache handled in userQuery.js
    const allUsers = await getAllUsers();
    return allUsers.filter(u => u.role === 'Student').sort(naturalSort);
};

export const addMemberNew = async (classId, data) => {
  try {
    const authResult = await handleRegisterLogic(data.name, data.username, data.password, 'Student', data.grade);
    if (!authResult.success) return authResult;
    
    const newUserId = authResult.id;
    const profileData = { parentName: data.parentName || '', parentPhone: data.parentPhone || '', address: data.address || '', officialSchool: data.officialSchool || '' };
    await updateUser(newUserId, profileData);

    const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
    await addDoc(studentsRef, { userId: newUserId, status: data.status || 'Đang học', joinedAt: serverTimestamp() });

    clearCache(`class_members_${classId}`);
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const addMemberExisting = async (classId, userId, initialStatus = 'Đang học') => {
    try {
        const studentsRef = collection(db, "cqa02", "app_data", "classes", classId, "students");
        const q = query(studentsRef, where("userId", "==", userId));
        const snap = await getDocs(q);
        
        if (!snap.empty) return { success: false, message: "Học sinh đã có trong lớp này" };
        
        await addDoc(studentsRef, { userId: userId, status: initialStatus, joinedAt: serverTimestamp() });
        clearCache(`class_members_${classId}`);
        return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
};

export const updateMember = async (classId, userId, relationId, data) => {
    try {
        const { status, ...profileData } = data;
        if (Object.keys(profileData).length > 0) {
            await updateUser(userId, profileData);
        }
        if (status && relationId) {
            const relationRef = doc(db, "cqa02", "app_data", "classes", classId, "students", relationId);
            await updateDoc(relationRef, { status });
        }
        clearCache(`class_members_${classId}`);
        return { success: true };
    } catch (error) { return { success: false, message: error.message }; }
};

export const deleteMember = async (classId, relationId) => {
  try {
    if (relationId) {
         await deleteDoc(doc(db, "cqa02", "app_data", "classes", classId, "students", relationId));
         clearCache(`class_members_${classId}`);
    }
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};