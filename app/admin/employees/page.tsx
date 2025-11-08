'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/lib/auth/AuthContext';
import { getAllEmployees, createEmployee, updateEmployee, deleteEmployee, toggleEmployeeActive, permanentlyDeleteEmployee } from '@/lib/firebase/employees';
import { Employee, EmployeeFormData, EmployeeRole } from '@/types/employee';
import { QRCodeSVG } from 'qrcode.react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Pencil, Trash2, QrCode, Plus, LogOut, Users, Search, ArrowLeft, UserCheck, UserX, X } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['owner', 'admin', 'manager', 'server', 'chef', 'cashier', 'delivery']),
  wage: z.number().min(0, 'Wage must be 0 or greater'),
  phone: z.string().min(1, 'Phone is required'),
  address: z.string().min(1, 'Address is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

function EmployeeManagementContent() {
  const { logout } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showQRCode, setShowQRCode] = useState<Employee | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      role: 'server',
      wage: 0,
      phone: '',
      address: '',
      email: '',
    },
  });

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getAllEmployees();
      setEmployees(data);
    } catch (err: any) {
      console.error('Error loading employees:', err);
      setError(err.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values: FormValues) => {
    try {
      setError('');
      
      const formData: EmployeeFormData = {
        name: values.name,
        role: values.role,
        wage: values.wage,
        phone: values.phone,
        address: values.address,
        email: values.email || undefined,
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await createEmployee(formData);
      }

      form.reset();
      setEditingEmployee(null);
      setIsDialogOpen(false);
      await loadEmployees();
    } catch (err: any) {
      console.error('Error saving employee:', err);
      setError(err.message || 'Failed to save employee.');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    form.reset({
      name: employee.name,
      role: employee.role,
      wage: employee.wage || 0,
      phone: employee.phone,
      address: employee.address,
      email: employee.email || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this employee?')) {
      return;
    }

    try {
      await deleteEmployee(id);
      await loadEmployees();
    } catch (err: any) {
      console.error('Error deleting employee:', err);
      setError(err.message || 'Failed to delete employee.');
    }
  };

  const handlePermanentDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently remove ${name}? This action cannot be undone.`)) {
      return;
    }

    try {
      await permanentlyDeleteEmployee(id);
      await loadEmployees();
    } catch (err: any) {
      console.error('Error permanently deleting employee:', err);
      setError(err.message || 'Failed to permanently delete employee.');
    }
  };

  const handleToggleActive = async (employee: Employee) => {
    try {
      await toggleEmployeeActive(employee.id, !employee.isActive);
      await loadEmployees();
    } catch (err: any) {
      console.error('Error toggling employee status:', err);
      setError(err.message || 'Failed to toggle employee status.');
    }
  };

  const handleAddNew = () => {
    setEditingEmployee(null);
    form.reset({
      name: '',
      role: 'server',
      wage: 0,
      phone: '',
      address: '',
      email: '',
    });
    setIsDialogOpen(true);
  };

  const handleDownloadQR = async (employee: Employee) => {
    try {
      const qrElement = document.querySelector(`#qr-${employee.id} svg`) as SVGElement;
      if (!qrElement) {
        setError('QR code element not found.');
        return;
      }

      // Get role label
      const roleLabel = roles.find(r => r.value === employee.role)?.label || employee.role;

      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setError('Failed to create canvas context.');
        return;
      }

      // Set canvas size
      const padding = 40;
      const qrSize = 400;
      const textHeight = 80;
      const totalHeight = textHeight + qrSize + padding * 2;
      const totalWidth = qrSize + padding * 2;
      canvas.width = totalWidth;
      canvas.height = totalHeight;

      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      // Draw name
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 32px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(employee.name, totalWidth / 2, padding);

      // Draw role
      ctx.font = '24px Arial';
      ctx.fillStyle = '#666666';
      ctx.fillText(roleLabel, totalWidth / 2, padding + 40);

      // Convert SVG to image
      const svgData = new XMLSerializer().serializeToString(qrElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        // Draw QR code
        const qrX = (totalWidth - qrSize) / 2;
        const qrY = textHeight + padding;
        ctx.drawImage(img, qrX, qrY, qrSize, qrSize);

        // Convert canvas to blob and download
        canvas.toBlob((blob) => {
          if (blob) {
            const downloadUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `${employee.name.replace(/\s+/g, '_')}_QR_Code.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(downloadUrl);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };

      img.onerror = () => {
        setError('Failed to load QR code image.');
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (err: any) {
      console.error('Error downloading QR code:', err);
      setError(err.message || 'Failed to download QR code.');
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.phone.includes(searchTerm) ||
    (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const activeEmployees = filteredEmployees.filter(e => e.isActive);
  const inactiveEmployees = filteredEmployees.filter(e => !e.isActive);

  const roles: { value: EmployeeRole; label: string; color: string }[] = [
    { value: 'owner', label: 'Owner', color: 'bg-indigo-100 text-indigo-800' },
    { value: 'admin', label: 'Admin', color: 'bg-red-100 text-red-800' },
    { value: 'manager', label: 'Manager', color: 'bg-purple-100 text-purple-800' },
    { value: 'server', label: 'Staff', color: 'bg-blue-100 text-blue-800' },
    { value: 'chef', label: 'Chef', color: 'bg-orange-100 text-orange-800' },
    { value: 'cashier', label: 'Cashier', color: 'bg-green-100 text-green-800' },
    { value: 'delivery', label: 'Delivery', color: 'bg-yellow-100 text-yellow-800' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
                <p className="text-gray-600 mt-1">Manage your restaurant workforce</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button 
                onClick={logout} 
                variant="outline" 
                className="h-10 px-5 gap-2 border-2 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 transition-all rounded-lg font-semibold shadow-sm hover:shadow-md"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={handleAddNew}
                    className="h-10 px-5 gap-2 shadow-md hover:shadow-lg transition-all rounded-lg font-semibold"
                    style={{ 
                      backgroundColor: '#4f46e5', 
                      color: '#ffffff',
                      border: 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#4338ca';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#4f46e5';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Employee</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>
                      {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingEmployee
                        ? 'Update employee information below.'
                        : 'Fill in the employee details. A QR code will be auto-generated.'}
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Employee name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Role *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="wage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Hourly Wage (£) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone *</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="Email (optional)" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-red-700 text-sm">{error}</p>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            form.reset();
                            setEditingEmployee(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {editingEmployee ? 'Update Employee' : 'Create Employee'}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Employees</CardTitle>
              <Users className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{filteredEmployees.length}</div>
              <p className="text-xs text-gray-600 mt-1">All employees</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Active Employees</CardTitle>
              <UserCheck className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{activeEmployees.length}</div>
              <p className="text-xs text-gray-600 mt-1">Currently active</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Inactive Employees</CardTitle>
              <UserX className="h-5 w-5 text-gray-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{inactiveEmployees.length}</div>
              <p className="text-xs text-gray-600 mt-1">Deactivated</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 max-w-md"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {error && !isDialogOpen && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-700">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Employees Table */}
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">Employees</CardTitle>
              <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                {filteredEmployees.length} {filteredEmployees.length === 1 ? 'employee' : 'employees'}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg font-medium">No employees found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm ? 'Try adjusting your search terms.' : 'Add your first employee to get started.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Employee</TableHead>
                      <TableHead className="font-semibold">Role</TableHead>
                      <TableHead className="font-semibold">Wage</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEmployees.map((employee) => {
                      const roleInfo = roles.find(r => r.value === employee.role);
                      return (
                        <TableRow key={employee.id} className="hover:bg-gray-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold">
                                {employee.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-gray-900">{employee.name}</div>
                                {employee.email && (
                                  <div className="text-sm text-gray-500">{employee.email}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`px-3 py-1 ${roleInfo?.color || 'bg-gray-100 text-gray-800'} text-xs font-semibold rounded-full capitalize`}>
                              {roleInfo?.label || employee.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-gray-900">
                              £{(employee.wage || 0).toFixed(2)}<span className="text-sm text-gray-500 font-normal">/hr</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-700">{employee.phone}</div>
                            {employee.address && (
                              <div className="text-xs text-gray-500 mt-1">{employee.address}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Switch
                                checked={employee.isActive}
                                onCheckedChange={() => handleToggleActive(employee)}
                              />
                              <span className={`text-sm font-medium ${
                                employee.isActive ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {employee.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowQRCode(employee)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                                title="View QR Code"
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(employee)}
                                className="h-8 w-8 p-0 hover:bg-indigo-50 hover:text-indigo-600"
                                title="Edit Employee"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {!employee.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePermanentDelete(employee.id, employee.name)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  title="Permanently Remove Employee"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                              {employee.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(employee.id)}
                                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                  title="Deactivate Employee"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* QR Code Dialog */}
      {showQRCode && (
        <Dialog open={!!showQRCode} onOpenChange={() => setShowQRCode(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{showQRCode.name}</DialogTitle>
              <DialogDescription>
                {roles.find(r => r.value === showQRCode.role)?.label || showQRCode.role}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center my-4">
              <div id={`qr-${showQRCode.id}`} className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value={showQRCode.qrCode}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQRCode(null)}>
                Close
              </Button>
              <Button onClick={() => handleDownloadQR(showQRCode)}>
                Download QR Code
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default function EmployeeManagement() {
  return (
    <ProtectedRoute>
      <EmployeeManagementContent />
    </ProtectedRoute>
  );
}

export const dynamic = 'force-dynamic';
