// Import the Firebase compat libraries
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
// If you use analytics, you might need: import 'firebase/compat/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDjJtmFxGQKMS2y9oV-6RcJyOHt_asSWD8",
  authDomain: "whatsapp-clone-3a7d0.firebaseapp.com",
  databaseURL: "https://whatsapp-clone-3a7d0-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "whatsapp-clone-3a7d0",
  storageBucket: "whatsapp-clone-3a7d0.firebasestorage.app",
  messagingSenderId: "474057640190",
  appId: "1:474057640190:web:565bd45c6618ba1d4a7daf"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// To use analytics with the compat library:
// const analytics = firebase.analytics();

export default firebase; // Export the initialized firebase namespace