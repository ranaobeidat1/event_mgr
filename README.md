# event_mgr 

A comprehensive course, notification management platform built with React Native and Firebase, designed for sahlab institutions to streamline course administration, and organizational communication.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

event_mgr is a modern, cross-platform application that digitizes course management workflows for Sahlab institutions. Built with enterprise-grade security and scalability in mind, it provides a comprehensive solution for managing student registrations, course content, and institutional communications.

### Key Capabilities

- **Multi-role Access Control**: regular users, administrator, and guest access levels
- **Real-time Notifications**: Push notifications with targeted delivery
- **Content Management**: Rich media gallery with cloud storage
- **Analytics Dashboard**: Comprehensive reporting and statistics
- **Cross-platform Support**: iOS, Android, and Web deployment
- **Offline Capability**: Core features work without internet connectivity

## Features

### regular user Experience
- **Course Discovery**: Browse and search available courses
- **Leaving Details**: leaving details process with form 
- **Content Gallery**: Access  media and updates
- **Push Notifications**: Receive important announcements 
- **Profile Management**: Update personal information and preferences

### Administrator Tools
- **Course Management**: Create, edit, and manage course offerings
- **users Analytics**: Track enrollment metrics and engagement
- **Content Publishing**: Share multimedia content and announcements
- **Notification Center**: Send targeted alerts to specific groups
- **User Management**: Manage roles and permissions
- **Statistical Reports**: Generate comprehensive performance reports

### Technical Features
- **Secure Authentication**: Firebase Authentication with role-based access
- **Cloud Storage**: Scalable media storage with CDN delivery
- **Real-time Database**: Firestore for instant data synchronization
- **Responsive Design**: Optimized for all screen sizes and orientations
- **Internationalization**: Hebrew RTL support with multi-language capability

## Architecture

### Technology Stack

**Frontend**
- React Native 0.76.9 with Expo SDK 52
- TypeScript for type safety
- NativeWind for styling (Tailwind CSS)
- Expo Router for navigation

**Backend Services**
- Firebase Authentication
- Cloud Firestore (NoSQL database)
- Firebase Cloud Storage
- Firebase Cloud Messaging (Push notifications)

**Development Tools**
- Expo CLI for development workflow
- EAS Build for production builds
- Firebase Console for backend management

### Project Structure

```
sahlab/
├── app/                    # Application source code
│   ├── (tabs)/            # Tab navigation screens
│   ├── alerts/            # Alert management
│   ├── classes/           # Course management
│   ├── posts/             # Gallery and content
│   ├── components/        # Reusable UI components
│   └── utils/             # Helper functions and utilities
├── assets/                # Static assets (images, fonts)
├── FirebaseConfig.tsx     # Firebase configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn package manager
- Expo CLI (`npm install -g @expo/cli`)
- Firebase project with required services enabled
- Development environment (Xcode for iOS, Android Studio for Android)

### System Requirements

- **iOS**: iOS 13.0 or later
- **Android**: Android 7.0 (API level 24) or later
- **Web**: Modern browsers with ES2015 support

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sahlab.git
   cd sahlab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication, Firestore, Storage, and Cloud Messaging
   - Download configuration files:
     - `google-services.json` for Android
     - `GoogleService-Info.plist` for iOS
   - Place files in the project root directory

4. **Update configuration**
   ```typescript
   // FirebaseConfig.tsx
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "your-sender-id",
     appId: "your-app-id"
   };
   ```

5. **Start development server**
   ```bash
   npx expo start
   ```

## Configuration

### Firebase Collections

The application uses the following Firestore collections:

```typescript
// Users collection
users/{userId}
├── firstName: string
├── lastName: string
├── email: string
├── role: "user" | "admin"
├── expoPushToken: string
└── createdAt: timestamp

// Courses collection
courses/{courseId}
├── name: string
├── description: string
├── location: string
├── schedule: string
├── maxCapacity: number
├── imageUrl: string[]
└── createdAt: timestamp

// Registrations collection
Registrations/{registrationId}
├── userId: string
├── courseId: string
├── firstName: string
├── lastName: string
├── phoneNumber: string
├── status: "active" | "cancelled"
└── registrationDate: timestamp
```

### Environment Variables

Create a `.env` file in the project root:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Usage

### Development Commands

```bash
# Start development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web browser
npm run web

# Run tests
npm test

# Lint code
npm run lint
```

### Building for Production

```bash
# Build for all platforms
npx eas build --platform all

# Build for specific platform
npx eas build --platform ios
npx eas build --platform android
```

### Deployment

```bash
# Deploy to app stores
npx eas submit --platform all

# Deploy web version to Firebase Hosting
npx expo export --platform web
firebase deploy
```

## API Documentation

### Authentication

The application uses Firebase Authentication with the following methods:

- `signInWithEmailAndPassword(email, password)` - User login
- `createUserWithEmailAndPassword(email, password)` - User registration
- `signOut()` - User logout
- `sendPasswordResetEmail(email)` - Password reset

### Database Operations

Key database operations include:

- **User Management**: Create, read, update user profiles
- **Course Management**: CRUD operations for courses
- **Registration Management**: Handle student enrollments
- **Content Management**: Manage gallery posts and media

### Push Notifications

Notification system supports:

- **Broadcast Messages**: Send to all users
- **Targeted Messages**: Send to specific courses or user groups
- **Scheduled Messages**: Queue messages for later delivery


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Project Information**
- **Institution**: Azrieli College of Engineering
- **Course**: תכנון וניהול פרויקטי
- **Academic Year**: 2024-2025
- **Status**: Production Ready

**Acknowledgments**
- Firebase team for excellent backend services
- Expo team for simplifying React Native development
- Open source community for libraries and tools
- Faculty advisors for guidance and support

