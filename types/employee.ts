export type EmployeeRole = 'owner' | 'admin' | 'manager' | 'server' | 'chef' | 'cashier' | 'delivery';

export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  wage: number;
  phone: string;
  address: string;
  qrCode: string; // Unique QR code identifier
  email?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  checkIn: Date;
  checkOut?: Date;
  date: string; // YYYY-MM-DD format
  totalHours?: number;
}

export interface EmployeeFormData {
  name: string;
  role: EmployeeRole;
  wage: number;
  phone: string;
  address: string;
  email?: string;
}

