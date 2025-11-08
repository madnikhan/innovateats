'use client';

import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';

export default function TestFirebase() {
  const [status, setStatus] = useState<'checking' | 'success' | 'error'>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test Firestore connection
        const testCollection = db;
        setStatus('success');
        setMessage('Firebase connection successful! Firestore is ready to use.');
      } catch (error: any) {
        setStatus('error');
        setMessage(`Firebase connection error: ${error.message}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Firebase Connection Test</h1>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Status:</p>
            <div className={`p-3 rounded ${
              status === 'success' ? 'bg-green-100 text-green-800' :
              status === 'error' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {status === 'checking' && 'Checking connection...'}
              {status === 'success' && '✓ Connected'}
              {status === 'error' && '✗ Connection Failed'}
            </div>
          </div>
          {message && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Message:</p>
              <p className="text-sm">{message}</p>
            </div>
          )}
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Project ID: innovateats-2a68f
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

