import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { Employee, EmployeeFormData } from '@/types/employee';
// Generate unique ID for QR code
const generateQRCode = (): string => {
  return crypto.randomUUID();
};

const EMPLOYEES_COLLECTION = 'employees';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert Employee from Firestore
const convertEmployee = (doc: any): Employee => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name || '',
    role: data.role || 'server',
    wage: data.wage ?? 0,
    phone: data.phone || '',
    address: data.address || '',
    qrCode: data.qrCode || '',
    email: data.email,
    createdAt: convertTimestamp(data.createdAt),
    updatedAt: convertTimestamp(data.updatedAt),
    isActive: data.isActive ?? true,
  };
};

// Get all employees
export const getAllEmployees = async (): Promise<Employee[]> => {
  const snapshot = await getDocs(collection(db, EMPLOYEES_COLLECTION));
  return snapshot.docs.map(convertEmployee);
};

// Get employee by ID
export const getEmployeeById = async (id: string): Promise<Employee | null> => {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) {
    return null;
  }
  
  return convertEmployee(docSnap);
};

// Get employee by QR code
export const getEmployeeByQRCode = async (qrCode: string): Promise<Employee | null> => {
  const q = query(
    collection(db, EMPLOYEES_COLLECTION),
    where('qrCode', '==', qrCode)
  );
  
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  
  return convertEmployee(snapshot.docs[0]);
};

// Create new employee
export const createEmployee = async (data: EmployeeFormData): Promise<string> => {
  const qrCode = generateQRCode(); // Generate unique QR code
  
  const employeeData = {
    ...data,
    qrCode,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isActive: true,
  };
  
  const docRef = await addDoc(collection(db, EMPLOYEES_COLLECTION), employeeData);
  return docRef.id;
};

// Update employee
export const updateEmployee = async (id: string, data: Partial<EmployeeFormData>): Promise<void> => {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

// Delete employee (soft delete by setting isActive to false)
export const deleteEmployee = async (id: string): Promise<void> => {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  await updateDoc(docRef, {
    isActive: false,
    updatedAt: serverTimestamp(),
  });
};

// Permanently delete employee from Firestore
export const permanentlyDeleteEmployee = async (id: string): Promise<void> => {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  await deleteDoc(docRef);
};

// Toggle employee active status
export const toggleEmployeeActive = async (id: string, isActive: boolean): Promise<void> => {
  const docRef = doc(db, EMPLOYEES_COLLECTION, id);
  await updateDoc(docRef, {
    isActive,
    updatedAt: serverTimestamp(),
  });
};

