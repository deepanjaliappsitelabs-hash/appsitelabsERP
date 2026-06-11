import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./config";

const invoicesCol = collection(db, "invoices");

function getSortableTime(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

export async function createInvoice(invoiceData) {
  const payload = {
    ...invoiceData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const ref = await addDoc(invoicesCol, payload);
  return ref.id;
}

export async function getInvoices(userId) {
  const q = query(invoicesCol, where("userId", "==", userId));
  const snap = await getDocs(q);
  return sortInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

export async function getAllInvoices() {
  const snap = await getDocs(invoicesCol);
  return sortInvoices(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
}

function sortInvoices(invoices) {
  return invoices.sort((a, b) => {
    const createdDiff = getSortableTime(b.createdAt) - getSortableTime(a.createdAt);
    if (createdDiff !== 0) return createdDiff;
    return getSortableTime(b.date) - getSortableTime(a.date);
  });
}

export async function getInvoiceById(id, userId) {
  const ref = doc(db, "invoices", id);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  const invoice = { id: snap.id, ...snap.data() };
  if (userId && invoice.userId !== userId) return null;
  return invoice;
}

export async function updateInvoice(id, data) {
  const ref = doc(db, "invoices", id);
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() });
}

export async function deleteInvoice(id) {
  const ref = doc(db, "invoices", id);
  await deleteDoc(ref);
}
