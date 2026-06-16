# Quick-Job — Production-Ready React Native App

A gig-economy marketplace connecting local job posters with nearby workers. Built with Expo, Firebase, and a modern design system.

---

## 📁 Project Structure

```
quick-job/
├── App.js                    # Root: auth gate, navigation, notifications
├── firebaseConfig.js         # Firebase init (Firestore, Auth)
├── theme/
│   └── index.js              # Design system: Colors, Typography, Spacing, Radius, Shadows
├── components/
│   └── UIComponents.js       # Reusable: GradientButton, Card, StatusBadge, Skeleton, StarRating…
├── screens/
│   ├── Login.js              # Email/password + Google sign-in, forgot password
│   ├── Signup.js             # Registration + email verification + Google
│   ├── Dashboard.js          # Home: stats, menu grid, latest job, latest review
│   ├── JobList.js            # Location-aware list, search, pagination, FAB
│   ├── JobDetails.js         # Full job info, apply / approve / take / complete flow
│   ├── PostJob.js            # Post job with type chips, pay selector, location capture
│   ├── Search.js             # Full search with status filters & pagination
│   ├── Profile.js            # User stats, posted jobs, chats, reviews, sign out
│   ├── Chat.js               # Real-time messaging, seeker approval in-chat
│   ├── Testimonial.js        # Star-tap rating + comment submission
│   └── AllTestimonials.js    # Paginated reviews with star-filter chips
├── utils/
│   ├── validation.js         # Email, password, phone, pay validators
│   ├── encryption.js         # Contact info encrypt/decrypt
│   ├── geocoding.js          # Reverse geocode with timeout, location settings
│   ├── googleAuth.js         # expo-auth-session Google OAuth hook
│   └── notifications.js      # Expo push notifications, token storage
├── assets/                   # logo1.png, adaptive-icon.png, splash.png, favicon.png
├── android/                  # Native Android project
├── ios/                      # Native iOS project
├── app.json                  # Expo config
└── package.json
```

---

## 🚀 Installation

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android) or Xcode 14+ (for iOS)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill in values
cp .env.example .env

# 3. Start dev server
npx expo start

# 4. Run on Android
npx expo run:android

# 5. Run on iOS
npx expo run:ios
```

---

## 🔧 Environment Setup

Create `.env` in the project root:

```env
# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google OAuth
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your_web_client_id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your_ios_client_id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your_android_client_id
EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID=your_expo_client_id

# Encryption
EXPO_PUBLIC_ENCRYPTION_KEY=your_32_char_key
```

---

## 📦 Key Dependencies

| Package | Purpose |
|---|---|
| `expo` ~51 | Managed workflow + SDK |
| `firebase` ^10 | Auth, Firestore |
| `@react-navigation/native` | Navigation container |
| `@react-navigation/stack` | Stack navigator |
| `expo-linear-gradient` | Gradient UI |
| `expo-location` | GPS & reverse geocoding |
| `expo-notifications` | Push notifications |
| `expo-auth-session` | Google OAuth |
| `react-native-safe-area-context` | Safe area insets |
| `react-native-paper` | Material UI base |

---

## 🏗️ Build Instructions

### Android — Debug APK
```bash
npx expo run:android
```

### Android — Release APK/AAB (EAS Build)
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile production
```

### iOS — Simulator
```bash
npx expo run:ios
```

### iOS — Release (EAS Build)
```bash
eas build --platform ios --profile production
```

### Local Android APK (without EAS)
```bash
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk
```

---

## 🔐 Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** → Email/Password and Google providers
3. Enable **Firestore Database** in production mode
4. Apply security rules from `firestore.rules`
5. Enable **Cloud Messaging** for push notifications

### Firestore Collections
- `jobs` — all job postings
- `chats/{chatId}/messages` — real-time chat messages
- `users` — push token storage (written by notifications util)

---

## ✅ Production Checklist

- [x] No `console.log` in production screens
- [x] No hardcoded secrets (all via `EXPO_PUBLIC_*` env vars)
- [x] Input validation on all forms
- [x] Error handling with user-friendly alerts on all async operations
- [x] Loading states on all buttons and async actions
- [x] Empty states on all lists
- [x] Skeleton loaders while data fetches
- [x] Real-time Firestore listeners with proper cleanup
- [x] Secure contact encryption/decryption
- [x] Push notification deep-link handling
- [x] Email verification flow
- [x] Android & iOS safe area handling
- [x] Keyboard avoiding views on all forms
- [x] FlatList pagination (no unbounded lists)
- [x] Location permission handling with settings fallback

---

## 📐 Design System

All design tokens live in `theme/index.js`:

- **Primary**: `#4F46E5` (Deep Indigo)
- **Accent**: `#7C3AED` (Electric Violet)
- **Success**: `#059669` (Emerald)
- **Gradients**: 6 named gradient pairs for menu tiles, buttons, headers

Components in `components/UIComponents.js`:
`GradientButton`, `OutlineButton`, `GhostButton`, `Card`, `StatusBadge`,
`SkeletonLine`, `JobCardSkeleton`, `SectionHeader`, `EmptyState`,
`StarRating`, `InputField`, `Divider`, `PayBadge`

---

## 🐞 Known Limitations

- Google Sign-in requires valid OAuth client IDs configured in `.env` and Firebase Console
- Push notifications require a physical device (not simulator)
- Location reverse-geocoding is rate-limited; failures fall back to coordinate display gracefully
- EAS Build requires an Expo account for cloud builds

# QuickJbApp
