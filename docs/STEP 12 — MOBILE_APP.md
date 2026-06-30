# STEP 12 — MOBILE_APP.md

## Status: Deprecated & Postponed to Version 2

To maximize the probability of launching within our 6-month timeline and €5,000 budget with only one engineer, a native mobile application (React Native/iOS/Android) has been removed from the MVP (Version 1) scope.

### Rationale:
* **High Development Overhead:** Building, testing, and maintaining native applications for iOS and Android requires significant platform-specific code and doubles the development lifecycle.
* **App Store Friction:** Apple App Store and Google Play Store reviews delay deployments and introduce developer account fees, certificates, and compliance overhead.
* **The Responsive Web Workaround:** The web dashboard (built with Vite and TailwindCSS) is configured as a mobile-first responsive Progressive Web App (PWA). Users can add a shortcut link directly to their smartphone home screen. This provides 90% of the value (real-time graphs, notification updates, settings access) with 0% of the native mobile overhead.

### Planned Path for Future Versions (V2):
* Package the existing React TypeScript code into a React Native Expo application.
* Implement native push notifications using Firebase Cloud Messaging (FCM) and Apple Push Notification service (APNs).
