'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { getEmployeeById } from '@/lib/firebase/employees';
import { getEmployeeAttendance, isEmployeeCheckedIn } from '@/lib/firebase/attendance';
import { Employee, AttendanceRecord } from '@/types/employee';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Home, Clock, QrCode, BarChart3 } from 'lucide-react';
import Link from 'next/link';

function EmployeeDashboardContent() {
  const searchParams = useSearchParams();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [todayHours, setTodayHours] = useState<number>(0);
  const [todayEarnings, setTodayEarnings] = useState<number>(0);
  const [currentSessionHours, setCurrentSessionHours] = useState<number>(0);
  const [weeklyHours, setWeeklyHours] = useState<number>(0);
  const [showQRCode, setShowQRCode] = useState<boolean>(false);

  // Load dashboard data once on mount
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError('');

        // Get employee ID from URL params or localStorage
        const employeeId = searchParams.get('id') || localStorage.getItem('employeeId');
        
        if (!employeeId) {
          setError('No employee ID found. Please scan your QR code to access the dashboard.');
          setLoading(false);
          return;
        }

        // Store employee ID in localStorage for persistence
        localStorage.setItem('employeeId', employeeId);

        // Fetch employee data
        const employeeData = await getEmployeeById(employeeId);
        if (!employeeData) {
          setError('Employee not found.');
          setLoading(false);
          return;
        }

        if (!employeeData.isActive) {
          setError('Your account is inactive. Please contact your administrator.');
          setLoading(false);
          return;
        }

        setEmployee(employeeData);

        // Check if currently checked in
        const checkedIn = await isEmployeeCheckedIn(employeeId);
        setIsCheckedIn(checkedIn);

        // Fetch attendance records (get more for weekly calculation)
        const attendanceRecords = await getEmployeeAttendance(employeeId, 30);
        setAttendance(attendanceRecords);

        // Calculate today's hours and earnings
        const today = new Date().toISOString().split('T')[0];
        const todayRecord = attendanceRecords.find(
          record => record.date === today
        );

        let todayHoursWorked = 0;
        if (todayRecord) {
          if (todayRecord.totalHours) {
            // Already checked out
            todayHoursWorked = todayRecord.totalHours;
          } else if (checkedIn) {
            // Currently checked in, calculate current session
            const checkInTime = todayRecord.checkIn.getTime();
            const now = new Date().getTime();
            todayHoursWorked = (now - checkInTime) / (1000 * 60 * 60);
            setCurrentSessionHours(todayHoursWorked);
          }
        }
        setTodayHours(todayHoursWorked);
        setTodayEarnings(todayHoursWorked * (employeeData.wage || 0));

        // Calculate weekly hours (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weekAgoStr = weekAgo.toISOString().split('T')[0];

        const weeklyRecords = attendanceRecords.filter(
          record => record.date >= weekAgoStr && record.totalHours
        );
        const weeklyTotal = weeklyRecords.reduce(
          (sum, record) => sum + (record.totalHours || 0),
          0
        );
        setWeeklyHours(weeklyTotal);

      } catch (err: any) {
        console.error('Error loading dashboard:', err);
        setError(err.message || 'Failed to load dashboard. Please try again.');
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [searchParams]);

  // Update current session hours every minute if checked in
  useEffect(() => {
    if (!isCheckedIn || !employee || !attendance.length) {
      return;
    }

    const updateSessionHours = () => {
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attendance.find(
        record => record.date === today && !record.checkOut
      );
      if (todayRecord) {
        const checkInTime = todayRecord.checkIn.getTime();
        const now = new Date().getTime();
        const hours = (now - checkInTime) / (1000 * 60 * 60);
        setCurrentSessionHours(hours);
        setTodayHours(hours);
        setTodayEarnings(hours * (employee.wage || 0));
      }
    };

    // Update immediately
    updateSessionHours();

    // Then update every minute
    const interval = setInterval(updateSessionHours, 60000);

    return () => clearInterval(interval);
  }, [isCheckedIn, employee, attendance]);

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatTime = (hours: number): string => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 pb-20">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-4xl text-red-600 mb-4">✗</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/scanner"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            Go to Scanner
          </Link>
        </div>
      </div>
    );
  }

  if (!employee) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {employee.name.split(' ')[0]}!
          </h1>
          <p className="text-sm text-gray-600 capitalize mt-1">{employee.role}</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-4">
        {/* Current Clock Status */}
        <div className={`rounded-2xl shadow-lg p-6 ${
          isCheckedIn 
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500' 
            : 'bg-white border-2 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-1">Current Status</p>
              <h2 className={`text-3xl font-bold mb-2 ${
                isCheckedIn ? 'text-green-800' : 'text-gray-800'
              }`}>
                {isCheckedIn ? '✓ Clocked In' : '○ Clocked Out'}
              </h2>
              {isCheckedIn && (
                <p className="text-sm text-green-700">
                  Session: {formatTime(currentSessionHours)}
                </p>
              )}
            </div>
            <div className={`text-6xl ${
              isCheckedIn ? 'text-green-600' : 'text-gray-400'
            }`}>
              {isCheckedIn ? '✓' : '○'}
            </div>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4">
          {/* Today's Hours */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <p className="text-xs font-medium text-gray-600">Today's Hours</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatTime(todayHours)}
            </p>
          </div>

          {/* Today's Earnings */}
          <div className="bg-white rounded-2xl shadow-lg p-5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <p className="text-xs font-medium text-gray-600">Today's Earnings</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(todayEarnings)}
            </p>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Weekly Summary</h3>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-lg font-bold text-gray-900">
                {formatTime(weeklyHours)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estimated Earnings</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(weeklyHours * (employee.wage || 0))}
              </span>
            </div>
          </div>
        </div>

        {/* QR Code Button */}
        <Button
          onClick={() => setShowQRCode(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 rounded-2xl shadow-lg"
          size="lg"
        >
          <QrCode className="w-5 h-5 mr-2" />
          Show My QR Code
        </Button>

        {/* Quick Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Hourly Wage</span>
              <span className="text-sm font-semibold text-gray-900">
                {formatCurrency(employee.wage || 0)}/hr
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Phone</span>
              <span className="text-sm font-semibold text-gray-900">
                {employee.phone}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
        <div className="max-w-md mx-auto px-4 py-2">
          <div className="flex items-center justify-around">
            <Link
              href="/"
              className="flex flex-col items-center justify-center py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Home className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">Home</span>
            </Link>
            <Link
              href="/scanner"
              className="flex flex-col items-center justify-center py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-6 h-6 text-indigo-600" />
              <span className="text-xs text-indigo-600 mt-1 font-semibold">Scanner</span>
            </Link>
            <button
              onClick={() => setShowQRCode(true)}
              className="flex flex-col items-center justify-center py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-6 h-6 text-gray-600" />
              <span className="text-xs text-gray-600 mt-1">My QR</span>
            </button>
            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center py-2 px-4 rounded-lg bg-indigo-50 rounded-lg transition-colors"
            >
              <Clock className="w-6 h-6 text-indigo-600" />
              <span className="text-xs text-indigo-600 mt-1 font-semibold">Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{employee.name}</DialogTitle>
            <DialogDescription>
              {employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center my-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG
                value={employee.qrCode}
                size={256}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQRCode(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function EmployeeDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <EmployeeDashboardContent />
    </Suspense>
  );
}
