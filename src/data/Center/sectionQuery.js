import { db } from "../Firebase/firebase-config";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { getCache, setCache, clearCache } from "../cacheHelper";

const SECTIONS_REF = collection(db, "cqa02", "app_data", "sections");
const GRADES_REF = collection(db, "cqa02", "app_data", "grades");
const SUBJECTS_REF = collection(db, "cqa02", "app_data", "subjects");

const fetchData = async (ref, cacheKey) => {
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const snapshot = await getDocs(ref);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  
  setCache(cacheKey, data);
  return data;
};

export const getSections = () => fetchData(SECTIONS_REF, "sections");
export const getGrades = () => fetchData(GRADES_REF, "grades");
export const getSubjects = () => fetchData(SUBJECTS_REF, "subjects");

const getCacheKeyByType = (type) => type === 'section' ? 'sections' : type === 'grade' ? 'grades' : 'subjects';

export const addItem = async (type, name, relations = {}) => {
  const ref = type === 'section' ? SECTIONS_REF : type === 'grade' ? GRADES_REF : SUBJECTS_REF;
  try {
    await addDoc(ref, { name, ...relations, createdAt: serverTimestamp() });
    clearCache(getCacheKeyByType(type));
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const updateItem = async (type, id, name, relations = {}) => {
  const ref = type === 'section' ? SECTIONS_REF : type === 'grade' ? GRADES_REF : SUBJECTS_REF;
  try {
    await updateDoc(doc(ref, id), { name, ...relations });
    clearCache(getCacheKeyByType(type));
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const deleteItem = async (type, id) => {
  const ref = type === 'section' ? SECTIONS_REF : type === 'grade' ? GRADES_REF : SUBJECTS_REF;
  try {
    await deleteDoc(doc(ref, id));
    clearCache(getCacheKeyByType(type));
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};