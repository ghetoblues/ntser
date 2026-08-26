import { type FirebaseOptions, initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

// Without a Firebase config the features that talk to NTS's backend cannot
// work, but everything else in the app can, so degrade instead of failing to
// boot. See scripts/firebase-config.mjs for where the config comes from.
const config: FirebaseOptions | null = FIREBASE_CONFIG

const app = config ? initializeApp(config) : null

export const auth = app ? getAuth(app) : null
export const store = app ? getFirestore(app) : null
