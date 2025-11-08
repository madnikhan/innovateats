'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { getEmployeeByQRCode } from '@/lib/firebase/employees';
import { checkInEmployee, checkOutEmployee, isEmployeeCheckedIn } from '@/lib/firebase/attendance';
import { Employee } from '@/types/employee';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

interface ScanResult {
  type: 'checkin' | 'checkout';
  employee: Employee;
  message: string;
}

export default function ScannerPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isCheckedIn, setIsCheckedIn] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const scannerElementId = 'qr-reader';
  const [cameraId, setCameraId] = useState<string | null>(null);

  useEffect(() => {
    // Mark as mounted to prevent hydration mismatch
    // Use setTimeout to ensure this happens after hydration completes
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Only initialize in browser environment after component is mounted
    if (!mounted || typeof window === 'undefined') {
      return;
    }

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (!scannerRef.current) {
        initializeScanner();
      }
    }, 100);

    // Cleanup on unmount
    return () => {
      clearTimeout(timer);
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        // Check if scanner is actually running before trying to stop
        const isScanning = scannerRef.current.getState() === 2; // 2 = SCANNING state
        if (isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err: any) {
        // Ignore errors about scanner not running
        if (!err.message?.includes('not running') && !err.message?.includes('not started')) {
          console.error('Error stopping scanner:', err);
        }
      }
      scannerRef.current = null;
    }
  };

  const initializeScanner = async () => {
    try {
      // Check if element exists
      const element = document.getElementById(scannerElementId);
      if (!element) {
        console.error('Scanner element not found');
        setError('Scanner element not found. Please refresh the page.');
        setStatus('error');
        return;
      }

      // Stop any existing scanner
      await stopScanner();

      const html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      // Get available cameras
      const devices = await Html5Qrcode.getCameras();
      
      if (devices && devices.length > 0) {
        // Use the first available camera (usually the back camera on mobile)
        const cameraId = devices[0].id;
        setCameraId(cameraId);

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment' // Prefer back camera on mobile
          }
        };

        // Add timeout for camera initialization
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Camera initialization timeout. Please try again.')), 10000);
        });

        await Promise.race([
          html5QrCode.start(
            cameraId,
            config,
            onScanSuccess,
            onScanError
          ),
          timeoutPromise
        ]);

        setStatus('scanning');
        setError('');
      } else {
        throw new Error('No cameras found. Please ensure your device has a camera.');
      }
    } catch (err: any) {
      console.error('Error initializing scanner:', err);
      // Handle specific error types
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setError('Camera permission denied. Please allow camera access and refresh the page.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('No cameras')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else if (err.message?.includes('timeout')) {
        setError('Camera initialization timeout. Please try again.');
      } else {
        setError(err.message || 'Failed to initialize camera. Please check permissions and try again.');
      }
      setStatus('error');
      await stopScanner();
    }
  };

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    // Prevent multiple simultaneous scans
    if (isProcessingRef.current) {
      return;
    }

    isProcessingRef.current = true;
    setStatus('processing');
    setError('');
    setScanResult(null);

    try {
      // Stop scanning temporarily
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }

      // Look up employee by QR code
      const employee = await getEmployeeByQRCode(decodedText);

      if (!employee) {
        throw new Error('Employee not found. Please check your QR code.');
      }

      if (!employee.isActive) {
        throw new Error('Employee account is inactive.');
      }

      // Check if employee is currently checked in
      const checkedIn = await isEmployeeCheckedIn(employee.id);

      let result: ScanResult;

      if (checkedIn) {
        // Check out
        await checkOutEmployee(employee.id);
        result = {
          type: 'checkout',
          employee,
          message: `Checked out successfully! Have a great day, ${employee.name}!`,
        };
      } else {
        // Check in
        await checkInEmployee(employee.id, employee.name);
        result = {
          type: 'checkin',
          employee,
          message: `Checked in successfully! Welcome, ${employee.name}!`,
        };
      }

      setScanResult(result);
      setIsCheckedIn(!checkedIn);
      setStatus('success');
      isProcessingRef.current = false;

      // Store employee ID in localStorage for dashboard access
      localStorage.setItem('employeeId', employee.id);

      // If checked in, redirect to dashboard after 2 seconds
      if (!checkedIn) {
        setTimeout(() => {
          router.push(`/dashboard?id=${employee.id}`);
        }, 2000);
      } else {
        // Resume scanning after 3 seconds for checkout
        setTimeout(() => {
          setStatus('scanning');
          setScanResult(null);
          setIsCheckedIn(null);
          initializeScanner();
        }, 3000);
      }
    } catch (err: any) {
      console.error('Scan error:', err);
      setError(err.message || 'An error occurred while processing the QR code.');
      setStatus('error');
      isProcessingRef.current = false;

      // Resume scanning after 2 seconds
      setTimeout(() => {
        setStatus('scanning');
        setError('');
        initializeScanner();
      }, 2000);
    }
  };

  const onScanError = (errorMessage: string) => {
    // Ignore common scanning errors (like "No QR code found")
    // These are expected while scanning
    if (
      !errorMessage.includes('No QR code found') &&
      !errorMessage.includes('NotFoundException') &&
      !errorMessage.includes('No MultiFormat Readers')
    ) {
      // Only log unexpected errors
      console.log('Scan error (non-fatal):', errorMessage);
    }
  };

  const handleRestartScan = async () => {
    await stopScanner();
    setStatus('idle');
    setError('');
    setScanResult(null);
    setIsCheckedIn(null);
    setTimeout(() => {
      initializeScanner();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Innovat Eats
          </h1>
          <p className="text-gray-600">
            Scan your QR code to check in/out
          </p>
        </div>

        {/* Scanner Container */}
        <div className="bg-white rounded-2xl shadow-xl p-4 mb-4">
          <div className="w-full min-h-[400px] relative" suppressHydrationWarning>
            {!mounted ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">Loading scanner...</p>
                </div>
              </div>
            ) : (
              <div id={scannerElementId} className="w-full" suppressHydrationWarning></div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {status === 'processing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600 mr-3"></div>
              <p className="text-yellow-800 font-medium">Processing...</p>
            </div>
          </div>
        )}

        {status === 'success' && scanResult && (
          <div className={`border-2 rounded-lg p-4 mb-4 ${
            scanResult.type === 'checkin' 
              ? 'bg-green-50 border-green-500' 
              : 'bg-blue-50 border-blue-500'
          }`}>
            <div className="text-center">
              <div className={`text-4xl mb-2 ${
                scanResult.type === 'checkin' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {scanResult.type === 'checkin' ? '✓' : '✓'}
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                scanResult.type === 'checkin' ? 'text-green-800' : 'text-blue-800'
              }`}>
                {scanResult.type === 'checkin' ? 'Checked In' : 'Checked Out'}
              </h3>
              <p className={`font-medium mb-1 ${
                scanResult.type === 'checkin' ? 'text-green-700' : 'text-blue-700'
              }`}>
                {scanResult.employee.name}
              </p>
              <p className={`text-sm ${
                scanResult.type === 'checkin' ? 'text-green-600' : 'text-blue-600'
              }`}>
                {scanResult.employee.role}
              </p>
              <p className="text-sm text-gray-600 mt-2">
                {scanResult.message}
              </p>
            </div>
          </div>
        )}

        {status === 'error' && error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-4">
            <div className="text-center">
              <div className="text-4xl text-red-600 mb-2">✗</div>
              <h3 className="text-lg font-bold text-red-800 mb-2">Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Restart Button */}
        {(status === 'error' || status === 'success') && (
          <button
            onClick={handleRestartScan}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Scan Again
          </button>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p className="mb-2">📱 Point your camera at the QR code</p>
          <p>Make sure the QR code is clearly visible and well-lit</p>
        </div>
      </div>
    </div>
  );
}

