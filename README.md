# Innovat Eats - Employee Management System

A comprehensive employee login and management system for Innovat Eats restaurant built with Next.js 14 and Firebase.

## Features

- ✅ **QR Code Scanner** - Employees can login/logout using QR codes
- ✅ **Employee Management** - Manage employee information (name, role, wage, phone, address)
- ✅ **Employee Mobile Dashboard** - Mobile-friendly dashboard for employees after login
- ✅ **Admin Analytics** - Analytics dashboard for administrators

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Firestore, Authentication)
- **QR Code**: html5-qrcode, qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- npm or yarn package manager

### Installation

1. **Clone the repository** (if applicable) or navigate to the project directory:
   ```bash
   cd innovateats
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Firebase**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Firestore Database
   - Enable Authentication (if needed)
   - Get your Firebase configuration from Project Settings

4. **Configure environment variables**:
   - Copy `.env.local.example` to `.env.local`:
     ```bash
     cp .env.local.example .env.local
     ```
   - Fill in your Firebase configuration values in `.env.local`:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

5. **Set up Firestore Security Rules** (in Firebase Console):
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Employees collection
       match /employees/{employeeId} {
         allow read: if true; // Adjust based on your security needs
         allow write: if request.auth != null; // Only authenticated users can write
       }
       
       // Attendance collection
       match /attendance/{attendanceId} {
         allow read: if true; // Adjust based on your security needs
         allow create: if true; // Allow QR code check-in
         allow update: if true; // Allow check-out
       }
     }
   }
   ```

6. **Run the development server**:
```bash
npm run dev
   ```

7. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
innovateats/
├── app/                    # Next.js App Router pages
│   ├── login/             # QR code scanner login page
│   ├── dashboard/         # Employee mobile dashboard
│   ├── admin/             # Admin dashboard with analytics
│   └── layout.tsx         # Root layout
├── components/            # Reusable React components
│   ├── QRScanner/        # QR code scanner component
│   ├── Employee/         # Employee-related components
│   ├── Dashboard/        # Dashboard components
│   └── Admin/            # Admin components
├── lib/                  # Utility functions and configurations
│   └── firebase/         # Firebase configuration and functions
│       ├── config.ts     # Firebase initialization
│       ├── employees.ts  # Employee CRUD operations
│       └── attendance.ts # Attendance tracking functions
├── types/                # TypeScript type definitions
│   └── employee.ts       # Employee and attendance types
└── public/               # Static assets
```

## Firebase Collections

### `employees`
Stores employee information:
- `id`: Document ID
- `name`: Employee name
- `role`: Employee role (owner, admin, manager, server, chef, cashier, delivery)
- `wage`: Hourly wage
- `phone`: Phone number
- `address`: Address
- `qrCode`: Unique QR code identifier
- `email`: Email address (optional)
- `isActive`: Active status
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

### `attendance`
Stores attendance records:
- `id`: Document ID
- `employeeId`: Reference to employee
- `employeeName`: Employee name (for quick access)
- `checkIn`: Check-in timestamp
- `checkOut`: Check-out timestamp (null if not checked out)
- `date`: Date in YYYY-MM-DD format
- `totalHours`: Total hours worked (calculated on checkout)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Next Steps

1. **Create the QR Scanner component** - Implement the QR code scanner for login/logout
2. **Build the Employee Dashboard** - Create the mobile-friendly employee dashboard
3. **Implement Admin Dashboard** - Build the admin analytics and management interface
4. **Add Authentication** - Implement Firebase Authentication for admin access
5. **Add Employee Management UI** - Create forms for adding/editing employees

## License

This project is private and proprietary.
