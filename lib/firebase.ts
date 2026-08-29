import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyAAj9NI9tHlfgZd3Xi4ie4l6z3c8xfJH_c',
  authDomain: 'buzzly-v.firebaseapp.com',
  databaseURL: 'https://buzzly-v-default-rtdb.firebaseio.com',
  projectId: 'buzzly-v',
  storageBucket: 'buzzly-v.appspot.com',
  messagingSenderId: '836493689240',
  appId: '1:836493689240:web:8026edda556fe3e599ebed',
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
const auth = getAuth(app)
const db = getDatabase(app)
const storage = getStorage(app)
const googleProvider = new GoogleAuthProvider()

export { app, auth, db, storage, googleProvider }
