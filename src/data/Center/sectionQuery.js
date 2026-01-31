// src/data/Center/sectionQuery.js
import { db } from "../Firebase/firebase-config";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

const SECTIONS_REF = collection(db, "cqa02", "app_data", "sections");
const GRADES_REF = collection(db, "cqa02", "app_data", "grades");
const SUBJECTS_REF = collection(db, "cqa02", "app_data", "subjects");

const fetchData = async (ref) => {
  const snapshot = await getDocs(ref);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
};

export const getSections = () => fetchData(SECTIONS_REF);
export const getGrades = () => fetchData(GRADES_REF);
export const getSubjects = () => fetchData(SUBJECTS_REF);

export const addItem = async (type, name, relations = {}) => {
  const ref = type === 'section' ? SECTIONS_REF : type === 'grade' ? GRADES_REF : SUBJECTS_REF;
  try {
    // Spread relations (gradeId, subjectId) into the document for sections
    await addDoc(ref, { 
      name, 
      ...relations, 
      createdAt: serverTimestamp() 
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updateItem = async (type, id, name, relations = {}) => {
  const ref = type === 'section' ? SECTIONS_REF : type === 'grade' ? GRADES_REF : SUBJECTS_REF;
  try {
    await updateDoc(doc(ref, id), { 
      name,
      ...relations
    });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deleteItem = async (type, id) => {
  const ref = type === 'section' ? SECTIONS_REF : type === 'grade' ? GRADES_REF : SUBJECTS_REF;
  try {
    await deleteDoc(doc(ref, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};