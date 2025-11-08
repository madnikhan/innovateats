'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import { getAllEmployees } from '@/lib/firebase/employees';
import { getTodayAttendance, getAttendanceRecords } from '@/lib/firebase/attendance';
import { Employee, AttendanceRecord, EmployeeRole } from '@/types/employee';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  checkedInToday: number;
  totalHoursToday: number;
  totalEarningsToday: number;
  employeesByRole: Record<EmployeeRole, number>;
}

function AdminDashboardContent() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    checkedInToday: 0,
    totalHoursToday: 0,
    totalEarningsToday: 0,
    employeesByRole: {
      owner: 0,
      admin: 0,
      manager: 0,
      server: 0,
      chef: 0,
      cashier: 0,
      delivery: 0,
    },
  });
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');

      // Load employees
      const employeesData = await getAllEmployees();
      setEmployees(employeesData);

      // Load today's attendance
      const todayData = await getTodayAttendance();
      setTodayAttendance(todayData);

      // Calculate statistics
      const activeEmployees = employeesData.filter(e => e.isActive);
      const checkedInToday = todayData.filter(record => !record.checkOut).length;
      
      // Calculate total hours and earnings for today
      const completedToday = todayData.filter(record => record.totalHours);
      const totalHoursToday = completedToday.reduce((sum, record) => sum + (record.totalHours || 0), 0);
      
      // Calculate earnings (need employee wages)
      let totalEarningsToday = 0;
      for (const record of completedToday) {
        const employee = employeesData.find(e => e.id === record.employeeId);
        if (employee && employee.wage) {
          totalEarningsToday += (record.totalHours || 0) * employee.wage;
        }
      }

      // Calculate employees by role
      const employeesByRole: Record<EmployeeRole, number> = {
        owner: 0,
        admin: 0,
        manager: 0,
        server: 0,
        chef: 0,
        cashier: 0,
        delivery: 0,
      };
      
      activeEmployees.forEach(employee => {
        if (employee.role && employeesByRole.hasOwnProperty(employee.role)) {
          employeesByRole[employee.role] = (employeesByRole[employee.role] || 0) + 1;
        }
      });

      setStats({
        totalEmployees: employeesData.length,
        activeEmployees: activeEmployees.length,
        checkedInToday,
        totalHoursToday,
        totalEarningsToday,
        employeesByRole,
      });
    } catch (err: any) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const getCurrentSessionHours = (record: AttendanceRecord): number => {
    if (record.checkOut) return 0;
    const checkInTime = record.checkIn.getTime();
    const now = new Date().getTime();
    return (now - checkInTime) / (1000 * 60 * 60);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 relative">
          <div className="flex flex-col items-center text-center pb-16 md:pb-0">
            <div className="relative w-20 h-20 flex items-center justify-center mb-2">
              <Image
                src="/logo.png"
                alt="Innovat Eats Logo"
                width={80}
                height={80}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">Overview of your restaurant operations</p>
          </div>
          <div className="absolute top-4 right-4 md:top-6 md:right-6 flex flex-wrap gap-2 md:gap-3 justify-end max-w-full">
            <Link
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
            >
              Back to Home
            </Link>
            <button
              onClick={loadDashboard}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
            >
              Refresh
            </button>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors text-sm md:text-base"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Employees */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Employees</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalEmployees}</p>
            <p className="text-sm text-gray-500 mt-1">{stats.activeEmployees} active</p>
          </div>

          {/* Checked In Today */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Checked In Today</h3>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.checkedInToday}</p>
            <p className="text-sm text-gray-500 mt-1">currently working</p>
          </div>

          {/* Total Hours Today */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Total Hours Today</h3>
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{stats.totalHoursToday.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">hours worked</p>
          </div>

          {/* Total Earnings Today */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">Earnings Today</h3>
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalEarningsToday)}</p>
            <p className="text-sm text-gray-500 mt-1">total earned</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Today's Attendance */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Today's Attendance</h2>
              <span className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            </div>

            {todayAttendance.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No attendance records for today.</p>
                <p className="text-sm text-gray-500 mt-2">Employees will appear here when they check in.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto overflow-x-hidden pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
                {todayAttendance.map((record) => {
                  const employee = employees.find(e => e.id === record.employeeId);
                  const isActive = !record.checkOut;
                  const hours = isActive ? getCurrentSessionHours(record) : (record.totalHours || 0);
                  
                  return (
                    <div
                      key={record.id}
                      className={`border-2 rounded-lg p-4 ${
                        isActive
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-gray-900">{record.employeeName}</span>
                            {employee && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded capitalize">
                                {employee.role}
                              </span>
                            )}
                            {isActive && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded">
                                Active
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Check In:</span>
                              <span className="ml-2 font-medium text-gray-900">
                                {formatTime(record.checkIn)}
                              </span>
                            </div>
                            {record.checkOut ? (
                              <div>
                                <span className="text-gray-600">Check Out:</span>
                                <span className="ml-2 font-medium text-gray-900">
                                  {formatTime(record.checkOut)}
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-gray-600">Status:</span>
                                <span className="ml-2 font-medium text-green-700">
                                  Currently working
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-2xl font-bold text-gray-900">
                            {hours.toFixed(2)}h
                          </p>
                          {employee && employee.wage && (
                            <p className="text-sm text-gray-600">
                              {formatCurrency(hours * employee.wage)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Employees by Role */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Employees by Role</h2>
            <div className="space-y-4">
              {Object.entries(stats.employeesByRole).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-gray-700 capitalize">{role}</span>
                  <span className="text-2xl font-bold text-gray-900">{count || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/employees"
              className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-6 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-700">Manage Employees</h3>
                  <p className="text-sm text-gray-600">Add, edit, or remove employees</p>
                </div>
              </div>
            </Link>

            <Link
              href="/scanner"
              className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-6 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center group-hover:bg-green-700 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-green-700">QR Scanner</h3>
                  <p className="text-sm text-gray-600">Scan employee QR codes</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg p-6 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center group-hover:bg-purple-700 transition-colors">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 group-hover:text-purple-700">View Analytics</h3>
                  <p className="text-sm text-gray-600">Detailed reports and insights</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <ProtectedRoute>
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}
