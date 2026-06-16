import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
  totalKm: number;
  totalPlaces: number;
  level: number;
  badges: string[];
  isPublic: boolean;
  createdAt: Date | null;
}

const USERS_COLLECTION = 'users';

export function getLevelFromKm(km: number): number {
  if (km < 10) return 1;
  if (km < 50) return 2;
  if (km < 100) return 3;
  if (km < 300) return 4;
  if (km < 500) return 5;
  if (km < 1000) return 6;
  return 7;
}

export function getLevelTitle(level: number): string {
  const titles = ['', 'Người mới bắt đầu', 'Lữ khách', 'Nhà thám hiểm', 'Người đi đường', 'Phượt thủ', 'Chiến binh đường xa', 'Huyền thoại'];
  return titles[level] || 'Huyền thoại';
}

export const userService = {
  async createOrUpdateProfile(uid: string, data: { displayName: string; photoURL: string; email: string }): Promise<void> {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid,
        displayName: data.displayName,
        photoURL: data.photoURL,
        email: data.email,
        totalKm: 0,
        totalPlaces: 0,
        level: 1,
        badges: [],
        isPublic: true,
        createdAt: serverTimestamp()
      });
    } else {
      // Update name/photo in case they changed
      await updateDoc(ref, {
        displayName: data.displayName,
        photoURL: data.photoURL
      });
    }
  },

  async getProfile(uid: string): Promise<UserProfile | null> {
    const ref = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      ...data,
      createdAt: data.createdAt?.toDate() || null
    } as UserProfile;
  },

  async searchByEmail(email: string): Promise<UserProfile[]> {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate() || null }) as UserProfile);
  },

  async updateStats(uid: string, totalKm: number, totalPlaces: number): Promise<void> {
    const level = getLevelFromKm(totalKm);
    const ref = doc(db, USERS_COLLECTION, uid);
    await updateDoc(ref, { totalKm, totalPlaces, level });
  }
};
