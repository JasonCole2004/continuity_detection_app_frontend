# Cut Safe — Continuity Detection App (Frontend)

A React Native mobile application built with Expo for film and TV production teams. Cut Safe automates continuity checking using AI-powered facial recognition and scene comparison, helping productions track talent appearance across shots and scenes.

---

## Features

### Authentication
- Two-tier login system: **Admin** (email + password) and **Crew** (access code + password)
- Biometric login support (fingerprint / Face ID)
- Password strength validation and secure credential storage
- Session expiration detection with automatic logout
- Terms and Conditions acceptance on account creation
- Password reset and Production ID recovery flows

### Talent Management
- Create, edit, and delete talent profiles with profile photos
- Search and filter talent by name or ID
- View individual talent profiles with all associated continuity photos grouped by scene

### Camera & Continuity Detection
1. **Facial Recognition** — Take or upload a photo to identify talent via the backend AI
   - Matched talent is shown with profile details
   - Falls back to manual search if no match is found
2. **Continuity Check** — Submit a photo with scene number and optional notes for AI analysis
   - Annotated result image highlighting flagged regions
   - Listed continuity issues with option to override and save
   - Side-by-side comparison with reference photo
3. **Manual Search** — Browse and select talent manually when facial recognition fails

### Settings
- **Admin only**: Reset password, manage crew members and access codes, view activity log, delete production account
- **All users**: Contact support, watch in-app tutorial, toggle high contrast mode, logout

### Accessibility
- High contrast mode toggle, persisted across sessions

---

## Project Structure

```
continuity_detection_app_frontend/
├── app/
│   ├── (tabs)/                   # Main tabbed navigation
│   │   ├── index.tsx             # Talent list (Home)
│   │   ├── camera.tsx            # Camera entry point
│   │   └── settings.tsx          # Settings
│   ├── camera/                   # Continuity detection workflow
│   │   ├── facial_recognition_result.tsx
│   │   ├── continuity_check.tsx
│   │   ├── continuity_check_result.tsx
│   │   ├── continuity_comparison.tsx
│   │   └── manual_search.tsx
│   ├── talent/                   # Talent profile CRUD
│   │   ├── [id].tsx
│   │   ├── new_profile.tsx
│   │   └── edit_profile.tsx
│   ├── photos/
│   │   └── [photoId].tsx         # Individual continuity photo view
│   ├── settings/                 # Admin settings screens
│   │   ├── manage_crew.tsx
│   │   ├── activity_log.tsx
│   │   ├── reset_password.tsx
│   │   ├── contact_support.tsx
│   │   └── delete_production_account.tsx
│   ├── login.tsx
│   ├── reset_password.tsx
│   └── recover_production_id.tsx
├── components/
│   ├── SearchBar.tsx
│   ├── Toast.tsx
│   └── TutorialModal.tsx
├── services/
│   ├── api.ts                    # API client
│   ├── auth.ts                   # Token/session management
│   └── biometrics.ts             # Biometric authentication
├── contexts/
│   └── ThemeContext.tsx           # High contrast mode
├── interfaces/
│   └── Talent.ts
└── constants/
    ├── api.ts                    # API base URL
    ├── icons.ts
    └── images.ts
```

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on a physical device, or an Android/iOS emulator

### Installation

```bash
npm install
```

### Running the App

```bash
npx expo start
```

Then open in:
- **Expo Go** (scan the QR code)
- **Android emulator** — press `a`
- **iOS simulator** — press `i`

---

## Backend

This app connects to the Cut Safe backend API via a configurable base URL in [constants/api.ts](constants/api.ts). The backend handles:
- Facial recognition and talent matching
- Continuity region analysis and issue detection
- User authentication and session management
- Crew and production account management

> Update the `API_BASE_URL` in `constants/api.ts` to point to your backend instance.

---

## Tech Stack

| Category | Library |
|---|---|
| Framework | React Native + Expo ~54 |
| Routing | Expo Router ~6 (file-based) |
| Styling | NativeWind + Tailwind CSS |
| Navigation | React Navigation v7 |
| Camera / Images | expo-image-picker, expo-image |
| Biometrics | expo-local-authentication |
| Secure Storage | expo-secure-store |
| Persistence | AsyncStorage |
| Language | TypeScript |

---

## Learn More

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [React Navigation](https://reactnavigation.org/)
