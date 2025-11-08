import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { AttendanceRecord } from '@/types/employee';

const ATTENDANCE_COLLECTION = 'attendance';

// Convert Firestore timestamp to Date
const convertTimestamp = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return timestamp instanceof Date ? timestamp : new Date(timestamp);
};

// Convert AttendanceRecord from Firestore
const convertAttendanceRecord = (doc: any): AttendanceRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    employeeId: data.employeeId,
    employeeName: data.employeeName,
    checkIn: convertTimestamp(data.checkIn),
    checkOut: data.checkOut ? convertTimestamp(data.checkOut) : undefined,
    date: data.date,
    totalHours: data.totalHours,
  };
};

// Check if employee is currently checked in
export const isEmployeeCheckedIn = async (employeeId: string): Promise<boolean> => {
  const today = new Date().toISOString().split('T')[0];
  
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('employeeId', '==', employeeId),
    where('date', '==', today)
  );
  
  const snapshot = await getDocs(q);
  const activeCheckIn = snapshot.docs.find(doc => !doc.data().checkOut);
  
  return !!activeCheckIn;
};

// Check in employee
export const checkInEmployee = async (employeeId: string, employeeName: string): Promise<string> => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Check if employee already checked in today (without checkout)
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('employeeId', '==', employeeId),
    where('date', '==', today)
  );
  
  const snapshot = await getDocs(q);
  // Check if there's an active check-in (no checkout)
  const activeCheckIn = snapshot.docs.find(doc => !doc.data().checkOut);
  if (activeCheckIn) {
    throw new Error('Employee already checked in today');
  }
  
  const attendanceData = {
    employeeId,
    employeeName,
    checkIn: serverTimestamp(),
    date: today,
    checkOut: null,
    totalHours: null,
  };
  
  const docRef = await addDoc(collection(db, ATTENDANCE_COLLECTION), attendanceData);
  return docRef.id;
};

// Check out employee
export const checkOutEmployee = async (employeeId: string): Promise<void> => {
  const today = new Date().toISOString().split('T')[0];
  
  // Find today's check-in record (without checkout)
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('employeeId', '==', employeeId),
    where('date', '==', today)
  );
  
  const snapshot = await getDocs(q);
  const activeCheckIn = snapshot.docs.find(doc => !doc.data().checkOut);
  
  if (!activeCheckIn) {
    throw new Error('No active check-in found for today');
  }
  
  const record = activeCheckIn;
  const checkInTime = record.data().checkIn.toDate();
  const checkOutTime = new Date();
  const totalHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60); // Convert to hours
  
  await updateDoc(doc(db, ATTENDANCE_COLLECTION, record.id), {
    checkOut: serverTimestamp(),
    totalHours: Math.round(totalHours * 100) / 100, // Round to 2 decimal places
  });
};

// Get attendance records for an employee
export const getEmployeeAttendance = async (employeeId: string, limitCount: number = 30): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('employeeId', '==', employeeId)
  );
  
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(convertAttendanceRecord);
  
  // Sort by checkIn time descending (most recent first) and limit
  return records
    .sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime())
    .slice(0, limitCount);
};

// Get all attendance records for a date range
export const getAttendanceRecords = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );
  
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(convertAttendanceRecord);
  
  // Sort by date descending, then by checkIn time descending
  return records.sort((a, b) => {
    const dateCompare = b.date.localeCompare(a.date);
    if (dateCompare !== 0) return dateCompare;
    return b.checkIn.getTime() - a.checkIn.getTime();
  });
};

// Get today's attendance
export const getTodayAttendance = async (): Promise<AttendanceRecord[]> => {
  const today = new Date().toISOString().split('T')[0];
  const q = query(
    collection(db, ATTENDANCE_COLLECTION),
    where('date', '==', today)
  );
  
  const snapshot = await getDocs(q);
  const records = snapshot.docs.map(convertAttendanceRecord);
  
  // Sort by checkIn time descending (most recent first)
  return records.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
};
