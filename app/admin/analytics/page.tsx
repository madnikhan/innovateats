'use client';

import { useEffect, useState, Suspense } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import { getAllEmployees } from '@/lib/firebase/employees';
import { getTodayAttendance, getAttendanceRecords } from '@/lib/firebase/attendance';
import { Employee, AttendanceRecord } from '@/types/employee';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Download, ArrowLeft, Users, Clock, DollarSign, TrendingUp } from 'lucide-react';

interface TodayHoursByEmployee {
  employeeId: string;
  employeeName: string;
  hours: number;
  earnings: number;
}

interface WeeklyHoursData {
  date: string;
  totalHours: number;
  totalEarnings: number;
  employeeCount: number;
}

interface RoleDistribution {
  role: string;
  count: number;
  value: number;
  [key: string]: string | number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function AnalyticsContent() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyHoursData[]>([]);
  const [todayHoursByEmployee, setTodayHoursByEmployee] = useState<TodayHoursByEmployee[]>([]);
  const [roleDistribution, setRoleDistribution] = useState<RoleDistribution[]>([]);
  const [totalClockedIn, setTotalClockedIn] = useState<number>(0);
  const [todayTotalHours, setTodayTotalHours] = useState<number>(0);
  const [todayTotalEarnings, setTodayTotalEarnings] = useState<number>(0);
  const [weeklyTotalHours, setWeeklyTotalHours] = useState<number>(0);
  const [weeklyTotalEarnings, setWeeklyTotalEarnings] = useState<number>(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch all employees
      const employeesData = await getAllEmployees();
      const activeEmployees = employeesData.filter(e => e.isActive);
      setEmployees(activeEmployees);

      // Calculate role distribution
      const roleCounts: Record<string, number> = {};
      activeEmployees.forEach(emp => {
        roleCounts[emp.role] = (roleCounts[emp.role] || 0) + 1;
      });
      const roleDist = Object.entries(roleCounts).map(([role, count]) => ({
        role: role.charAt(0).toUpperCase() + role.slice(1),
        count,
        value: count,
      }));
      setRoleDistribution(roleDist);

      // Fetch today's attendance
      const todayData = await getTodayAttendance();
      setTodayAttendance(todayData);

      // Calculate employees currently clocked in
      const clockedIn = todayData.filter(record => !record.checkOut);
      setTotalClockedIn(clockedIn.length);

      // Calculate today's hours by employee
      const todayHoursMap: Record<string, { name: string; hours: number; wage: number }> = {};
      
      todayData.forEach(record => {
        const employee = activeEmployees.find(e => e.id === record.employeeId);
        if (employee && employee.wage && employee.wage > 0) {
          let hours = 0;
          if (record.totalHours) {
            // Already checked out - use stored total hours
            hours = record.totalHours;
          } else if (!record.checkOut) {
            // Currently checked in, calculate current hours
            const checkInTime = record.checkIn.getTime();
            const now = new Date().getTime();
            hours = (now - checkInTime) / (1000 * 60 * 60);
          }

          // Only process if hours > 0
          if (hours > 0) {
            if (todayHoursMap[record.employeeId]) {
              // Accumulate hours if employee has multiple records (shouldn't happen, but handle it)
              // Use the wage from the first record (should be the same)
              todayHoursMap[record.employeeId].hours += hours;
            } else {
              todayHoursMap[record.employeeId] = {
                name: record.employeeName,
                hours,
                wage: parseFloat(employee.wage.toFixed(2)), // Ensure wage is properly formatted
              };
            }
          }
        }
      });

      const todayHoursList: TodayHoursByEmployee[] = Object.entries(todayHoursMap)
        .map(([employeeId, data]) => {
          // Calculate earnings using full precision hours and wage, then round both separately
          // This ensures accuracy: if hours = 0.55818... and wage = 11, earnings = 6.14 (not 6.16)
          const rawEarnings = data.hours * data.wage;
          const roundedHours = Math.round(data.hours * 100) / 100;
          const roundedEarnings = Math.round(rawEarnings * 100) / 100;
          return {
            employeeId,
            employeeName: data.name,
            hours: roundedHours,
            earnings: roundedEarnings,
          };
        })
        .filter(item => item.hours > 0) // Filter out any entries with 0 hours
        .sort((a, b) => b.hours - a.hours);

      setTodayHoursByEmployee(todayHoursList);

      // Calculate today's totals
      const todayTotal = todayHoursList.reduce((sum, item) => sum + item.hours, 0);
      const todayEarnings = todayHoursList.reduce((sum, item) => sum + item.earnings, 0);
      setTodayTotalHours(parseFloat(todayTotal.toFixed(2)));
      setTodayTotalEarnings(parseFloat(todayEarnings.toFixed(2)));

      // Fetch weekly data (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];

      const weeklyRecords = await getAttendanceRecords(weekAgoStr, todayStr);
      
      // Group by date
      const weeklyMap: Record<string, { hours: number; earnings: number; employees: Set<string> }> = {};
      
      weeklyRecords.forEach(record => {
        if (record.totalHours) {
          const employee = activeEmployees.find(e => e.id === record.employeeId);
          if (employee) {
            const hours = record.totalHours;
            const earnings = hours * (employee.wage || 0);
            
            if (weeklyMap[record.date]) {
              weeklyMap[record.date].hours += hours;
              weeklyMap[record.date].earnings += earnings;
              weeklyMap[record.date].employees.add(record.employeeId);
            } else {
              weeklyMap[record.date] = {
                hours,
                earnings,
                employees: new Set([record.employeeId]),
              };
            }
          }
        }
      });

      // Convert to array and sort by date
      const weeklyDataList: WeeklyHoursData[] = Object.entries(weeklyMap)
        .map(([date, data]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          totalHours: Math.round(data.hours * 100) / 100,
          totalEarnings: Math.round(data.earnings * 100) / 100,
          employeeCount: data.employees.size,
        }))
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime();
        });

      setWeeklyData(weeklyDataList);

      // Calculate weekly totals
      const weeklyTotal = weeklyDataList.reduce((sum, item) => sum + item.totalHours, 0);
      const weeklyEarnings = weeklyDataList.reduce((sum, item) => sum + item.totalEarnings, 0);
      setWeeklyTotalHours(Math.round(weeklyTotal * 100) / 100);
      setWeeklyTotalEarnings(Math.round(weeklyEarnings * 100) / 100);

    } catch (err: any) {
      console.error('Error loading analytics:', err);
      setError(err.message || 'Failed to load analytics data.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    // Create CSV content
    let csvContent = 'Employee Analytics Report\n';
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`;
    
    csvContent += 'Summary\n';
    csvContent += `Total Employees: ${employees.length}\n`;
    csvContent += `Currently Clocked In: ${totalClockedIn}\n`;
    csvContent += `Today's Total Hours: ${todayTotalHours}\n`;
    csvContent += `Today's Total Earnings: £${todayTotalEarnings.toFixed(2)}\n`;
    csvContent += `Weekly Total Hours: ${weeklyTotalHours}\n`;
    csvContent += `Weekly Total Earnings: £${weeklyTotalEarnings.toFixed(2)}\n\n`;

    csvContent += 'Today\'s Hours by Employee\n';
    csvContent += 'Employee Name,Hours,Earnings\n';
    todayHoursByEmployee.forEach(item => {
      csvContent += `"${item.employeeName}",${item.hours},£${item.earnings.toFixed(2)}\n`;
    });

    csvContent += '\nWeekly Hours Report\n';
    csvContent += 'Date,Total Hours,Total Earnings,Employee Count\n';
    weeklyData.forEach(item => {
      csvContent += `"${item.date}",${item.totalHours},£${item.totalEarnings.toFixed(2)},${item.employeeCount}\n`;
    });

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analytics-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatHoursMinutes = (totalHours: number): string => {
    const hours = Math.floor(totalHours);
    const minutes = Math.round((totalHours - hours) * 60);
    if (hours === 0) {
      return `${minutes}m`;
    }
    if (minutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle className="text-3xl">Analytics Dashboard</CardTitle>
                <CardDescription>Employee performance and hours tracking</CardDescription>
              </div>
              <div className="mt-4 md:mt-0 flex gap-3">
                <Link href="/admin">
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Admin
                  </Button>
                </Link>
                <Button onClick={exportToCSV} variant="default">
                  <Download className="mr-2 h-4 w-4" />
                  Export to CSV
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Error Message */}
        {error && (
          <Card className="border-red-500">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{employees.length}</div>
              <p className="text-xs text-muted-foreground">Active employees</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Currently Clocked In</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClockedIn}</div>
              <p className="text-xs text-muted-foreground">Right now</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Hours</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHoursMinutes(todayTotalHours)}</div>
              <p className="text-xs text-muted-foreground">Total hours today ({todayTotalHours.toFixed(2)}h)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(todayTotalEarnings)}</div>
              <p className="text-xs text-muted-foreground">Total earnings today</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Hours by Employee */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Hours by Employee</CardTitle>
              <CardDescription>Hours worked today per employee</CardDescription>
            </CardHeader>
            <CardContent>
              {todayHoursByEmployee.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No hours recorded today
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={todayHoursByEmployee}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="employeeName" 
                      angle={-45}
                      textAnchor="end"
                      height={100}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="hours" fill="#3b82f6" name="Hours" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Role Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Employee Distribution by Role</CardTitle>
              <CardDescription>Number of employees per role</CardDescription>
            </CardHeader>
            <CardContent>
              {roleDistribution.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No employees found
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ role, value }) => `${role}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Hours Report */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Hours Report</CardTitle>
              <CardDescription>Total hours worked over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No weekly data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="totalHours" 
                      stroke="#3b82f6" 
                      name="Total Hours"
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="employeeCount" 
                      stroke="#10b981" 
                      name="Employees"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Weekly Earnings */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Earnings</CardTitle>
              <CardDescription>Total earnings over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              {weeklyData.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No weekly data available
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Bar dataKey="totalEarnings" fill="#10b981" name="Earnings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Today's Hours Table */}
        <Card>
          <CardHeader>
            <CardTitle>Today's Hours by Employee</CardTitle>
            <CardDescription>Detailed breakdown of hours and earnings</CardDescription>
          </CardHeader>
          <CardContent>
            {todayHoursByEmployee.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hours recorded today
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-semibold">Employee</th>
                      <th className="text-right p-2 font-semibold">Hours</th>
                      <th className="text-right p-2 font-semibold">Earnings</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayHoursByEmployee.map((item) => (
                      <tr key={item.employeeId} className="border-b hover:bg-gray-50">
                        <td className="p-2">{item.employeeName}</td>
                        <td className="p-2 text-right">
                          <span className="font-semibold">{formatHoursMinutes(item.hours)}</span>
                          <span className="text-xs text-gray-500 ml-1">({item.hours.toFixed(2)}h)</span>
                        </td>
                        <td className="p-2 text-right">{formatCurrency(item.earnings)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-bold">
                      <td className="p-2">Total</td>
                      <td className="p-2 text-right">
                        <span>{formatHoursMinutes(todayTotalHours)}</span>
                        <span className="text-xs text-gray-500 ml-1 font-normal">({todayTotalHours.toFixed(2)}h)</span>
                      </td>
                      <td className="p-2 text-right">{formatCurrency(todayTotalEarnings)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <AnalyticsContent />
    </ProtectedRoute>
  );
}

