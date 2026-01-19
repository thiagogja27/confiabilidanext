import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"

const firebaseConfig = {
  apiKey: "AIzaSyA6so98ByKxeiVfFFOSXjOxfyuf1L8zPK8",
  authDomain: "balanca-2bbe5.firebaseapp.com",
  databaseURL: "https://balanca-2bbe5-default-rtdb.firebaseio.com",
  projectId: "balanca-2bbe5",
  storageBucket: "balanca-2bbe5.appspot.com",
  messagingSenderId: "63797814535",
  appId: "1:63797814535:web:2e268c631943d8270091a2",
}

function getFirebaseApp(): FirebaseApp {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig)
  }
  return getApp()
}

const app = getFirebaseApp()

export const auth: Auth = getAuth(app)
export const database: Database = getDatabase(app)
export { app }
