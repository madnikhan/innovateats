'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Html5Qrcode, Html5QrcodeScanType } from 'html5-qrcode';
import { getEmployeeByQRCode } from '@/lib/firebase/employees';
import { checkInEmployee, checkOutEmployee, isEmployeeCheckedIn } from '@/lib/firebase/attendance';
import { Employee } from '@/types/employee';

type ScanStatus = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

interface ScanResult {
  type: 'checkin' | 'checkout';
  employee: Employee;
  message: string;
}

function HomeContent() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<ScanStatus>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  const [isCheckedIn, setIsCheckedIn] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef<boolean>(false);
  const scannerElementId = 'qr-reader';

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      return;
    }

    const timer = setTimeout(() => {
      if (!scannerRef.current) {
        initializeScanner();
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
    };
  }, [mounted]);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const isScanning = scannerRef.current.getState() === 2;
        if (isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (err: any) {
        if (!err.message?.includes('not running') && !err.message?.includes('not started')) {
          console.error('Error stopping scanner:', err);
        }
      }
      scannerRef.current = null;
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Check if Permissions API is available
      if (navigator.permissions && navigator.permissions.query) {
        const permissionStatus = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permissionStatus.state === 'granted') {
          return true;
        }
        if (permissionStatus.state === 'denied') {
          return false;
        }
      }

      // Try to get user media to trigger permission request
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        return true;
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          return false;
        }
        // For other errors, try to proceed anyway
        return true;
      }
    } catch (err) {
      // If Permissions API is not available, try to proceed
      return true;
    }
  };

  const initializeScanner = async () => {
    try {
      const element = document.getElementById(scannerElementId);
      if (!element) {
        setError('Scanner element not found. Please refresh the page.');
        setStatus('error');
        return;
      }

      await stopScanner();

      // Request camera permission explicitly (important for Android PWAs)
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setError('Camera permission is required. Please allow camera access in your browser settings.');
        setStatus('error');
        return;
      }

      const html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      // Get available cameras with better error handling
      let devices: Array<{ id: string; label?: string }> = [];
      try {
        devices = await Html5Qrcode.getCameras();
      } catch (err: any) {
        // If getCameras fails, try to start with default camera
        console.warn('Could not enumerate cameras, trying default camera:', err);
        devices = [];
      }

      let cameraId: string | null = null;
      
      if (devices && devices.length > 0) {
        // Prefer back camera (environment) on mobile
        const backCamera = devices.find((device) => 
          device.label?.toLowerCase().includes('back') || 
          device.label?.toLowerCase().includes('rear') ||
          device.label?.toLowerCase().includes('environment')
        );
        cameraId = backCamera ? backCamera.id : devices[0].id;
      }

      // Configuration optimized for mobile/PWA
      const config: any = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      };

      // Add video constraints for better mobile support
      if (cameraId) {
        config.videoConstraints = {
          deviceId: { exact: cameraId },
          facingMode: 'environment'
        };
      } else {
        // Fallback: use facingMode without deviceId
        config.videoConstraints = {
          facingMode: 'environment'
        };
      }

      // Try to start the scanner
      try {
        if (cameraId) {
          await html5QrCode.start(
            cameraId,
            config,
            onScanSuccess,
            onScanError
          );
        } else {
          // Fallback: try to start without specifying camera
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            onScanError
          );
        }

        setStatus('scanning');
        setError('');
      } catch (startError: any) {
        // If start fails with deviceId, try without it
        if (cameraId && startError.message?.includes('device')) {
          console.warn('Failed to start with specific camera, trying default:', startError);
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            onScanSuccess,
            onScanError
          );
          setStatus('scanning');
          setError('');
        } else {
          throw startError;
        }
      }
    } catch (err: any) {
      console.error('Error initializing scanner:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('permission')) {
        setError('Camera permission denied. Please allow camera access in your browser settings and try again.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('No cameras') || err.message?.includes('couldn\'t start video source')) {
        setError('Could not access camera. Please ensure your device has a camera and grant camera permissions.');
      } else if (err.message?.includes('timeout')) {
        setError('Camera initialization timed out. Please try again.');
      } else {
        setError(err.message || 'Failed to initialize camera. Please try refreshing the page.');
      }
      setStatus('error');
      await stopScanner();
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;

    isProcessingRef.current = true;
    setStatus('processing');
    setError('');

    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
      }

      const employee = await getEmployeeByQRCode(decodedText);
      if (!employee) {
        throw new Error('Employee not found.');
      }

      if (!employee.isActive) {
        throw new Error('Employee account is inactive.');
      }

      const checkedIn = await isEmployeeCheckedIn(employee.id);
      let result: ScanResult;

      if (checkedIn) {
        await checkOutEmployee(employee.id);
        result = {
          type: 'checkout',
          employee,
          message: `Checked out successfully! Have a great day, ${employee.name}!`,
        };
      } else {
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

      localStorage.setItem('employeeId', employee.id);

      if (!checkedIn) {
        setTimeout(() => {
          router.push(`/dashboard?id=${employee.id}`);
        }, 2000);
      } else {
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

      setTimeout(() => {
        setStatus('scanning');
        setError('');
        initializeScanner();
      }, 2000);
    }
  };

  const onScanError = () => {
    // Ignore scan errors
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4 relative">
      {/* Admin Button */}
      <Link
        href="/login"
        className="absolute top-4 right-4 bg-black hover:bg-gray-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg z-10"
      >
        Admin
      </Link>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <Image
                src="/logo.png"
                alt="Innovat Eats Logo"
                width={128}
                height={128}
                className="object-contain"
                priority
                unoptimized
              />
            </div>
          </div>
          <p className="text-gray-600 text-lg">
            Scan your QR code to check in or out
          </p>
        </div>

        {/* Scanner */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-700 text-sm mb-3">{error}</p>
              <button
                onClick={initializeScanner}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Retry Camera
              </button>
            </div>
          )}

          {scanResult && (
            <div className={`mb-4 p-4 rounded-lg ${
              scanResult.type === 'checkin' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-blue-50 border border-blue-200'
            }`}>
              <p className={`font-semibold ${
                scanResult.type === 'checkin' ? 'text-green-800' : 'text-blue-800'
              }`}>
                {scanResult.message}
              </p>
            </div>
          )}

          <div className="flex justify-center">
            {!mounted ? (
              <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Initializing scanner...</p>
                </div>
              </div>
            ) : (
              <div className="w-full">
                <div
                  id={scannerElementId}
                  className="w-full rounded-lg overflow-hidden"
                  suppressHydrationWarning
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
