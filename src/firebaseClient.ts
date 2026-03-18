// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Types

interface DailyStats {
    date: string
    keystrokes: number
    lines: number
    commits: number
    xpGained: number

};

// Helpers 
// ISO: Converts into standardized format "2026-03-17T14:32:45.000Z"
// split[T]: splits the string at the T (just for yyyy-mm-dd)

const getTodayKey = () => {
    return new Date().toISOString().split("T")[0];
};

/*
    Partial<DailyStats>: all stats not required, just the ones that are updating 

    Access the db and pull out the stats
    Checks to see if a document is already exists. If it already exists we grab that document. if not fresh 0's on all fields
    Prevents overwriting of data 

    In the existing data, we overwrite any necessary data in setDoc 
    ...current spreads the existing data
    ...stats focuses on only the data updating

*/

export const saveDailyStats = async(stats: Partial<DailyStats>) => {
    try {
        const dateKey = getTodayKey();
        const docRef = doc(db, "stats", dateKey);

        const existing = await getDoc(docRef);
        const current = existing.exists() ? existing.data() as DailyStats : {
            date: dateKey,
            keystrokes: 0,
            lines: 0,
            commits: 0,
            xpGained: 0
        };

        await setDoc(docRef, {
            ...current,
            ...stats,
            date: dateKey,
        });
    } catch (e) {
        console.error("firebase write error", e);
    }



};

export const getStatsHistory = async(days: number = 365) => {
    try{
        const statsRef = collection(db, "stats");
        const q = query(statsRef, orderBy("date", "desc"), limit(days));
        const snapshot = await getDocs(q)

        return snapshot.docs.map(doc => doc.data() as DailyStats);
    } catch (e){
        console.error("firebase read error", e);
        return[];
    }

};