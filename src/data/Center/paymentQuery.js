// src/data/Center/paymentQuery.js
import { db } from "../Firebase/firebase-config";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from "firebase/firestore";

// Collection Reference: cqa02 -> app_data -> payments
const PAYMENTS_REF = collection(db, "cqa02", "app_data", "payments");

// ==============================
// PAYMENTS CRUD
// ==============================

export const getPaymentsByClass = async (classId) => {
  try {
    const q = query(PAYMENTS_REF, where("classId", "==", classId));
    const snapshot = await getDocs(q);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      // Sort recently created first
      .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  } catch (error) {
    console.error("Error fetching payments:", error);
    return [];
  }
};

export const addPayment = async (data) => {
  try {
    await addDoc(PAYMENTS_REF, { ...data, createdAt: serverTimestamp() });
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const updatePayment = async (id, data) => {
  try {
    await updateDoc(doc(PAYMENTS_REF, id), data);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

export const deletePayment = async (id) => {
  try {
    await deleteDoc(doc(PAYMENTS_REF, id));
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};