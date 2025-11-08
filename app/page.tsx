'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
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

  const initializeScanner = async () => {
    try {
      const element = document.getElementById(scannerElementId);
      if (!element) {
        setError('Scanner element not found. Please refresh the page.');
        setStatus('error');
        return;
      }

      await stopScanner();

      const html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        const cameraId = devices[0].id;
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          videoConstraints: {
            facingMode: 'environment'
          }
        };

        await html5QrCode.start(
          cameraId,
          config,
          onScanSuccess,
          onScanError
        );

        setStatus('scanning');
        setError('');
      } else {
        throw new Error('No cameras found.');
      }
    } catch (err: any) {
      console.error('Error initializing scanner:', err);
      if (err.name === 'NotAllowedError' || err.message?.includes('permission')) {
        setError('Camera permission denied. Please allow camera access.');
      } else if (err.name === 'NotFoundError' || err.message?.includes('No cameras')) {
        setError('No camera found. Please ensure your device has a camera.');
      } else {
        setError(err.message || 'Failed to initialize camera.');
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
              <p className="text-red-700 text-sm">{error}</p>
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
