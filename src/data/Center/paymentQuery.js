import { db } from "../Firebase/firebase-config";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { getCache, setCache, clearCache } from "../cacheHelper";

const PAYMENTS_REF = collection(db, "cqa02", "app_data", "payments");

export const getPaymentsByClass = async (classId) => {
  const cacheKey = `payments_${classId}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const q = query(PAYMENTS_REF, where("classId", "==", classId));
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
    setCache(cacheKey, data);
    return data;
  } catch (error) { return []; }
};

export const addPayment = async (data) => {
  try {
    await addDoc(PAYMENTS_REF, { ...data, createdAt: serverTimestamp() });
    clearCache("payments_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const updatePayment = async (id, data) => {
  try {
    await updateDoc(doc(PAYMENTS_REF, id), data);
    clearCache("payments_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};

export const deletePayment = async (id) => {
  try {
    await deleteDoc(doc(PAYMENTS_REF, id));
    clearCache("payments_");
    return { success: true };
  } catch (error) { return { success: false, message: error.message }; }
};