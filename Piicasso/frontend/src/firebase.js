import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase only if config is present
let app = null;
let analytics = null;
let auth = null;
let googleProvider = null;

if (firebaseConfig.projectId) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        googleProvider = new GoogleAuthProvider();

        // Analytics can fail in localhost/non-https — init async and silently
        isSupported().then((supported) => {
            if (supported) {
                analytics = getAnalytics(app);
            }
        }).catch(() => {});
    } catch (err) {
        console.warn("Firebase initialization failed:", err.message);
    }
} else {
    console.warn("Firebase config missing — Google login will be unavailable.");
}

export { analytics, auth, googleProvider };
