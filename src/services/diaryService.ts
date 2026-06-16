import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';

export interface CheckIn {
  id: string;
  userId: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  timestamp: Date;
  activityText: string;
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=vi`);
    if (!response.ok) return 'Địa chỉ không xác định';
    const data = await response.json();
    return data.display_name || 'Địa chỉ không xác định';
  } catch (error) {
    console.error("Geocoding error", error);
    return 'Không thể lấy địa chỉ';
  }
}

const COLLECTION_NAME = 'travel_diary';

export const diaryService = {
  async addCheckIn(checkIn: Omit<CheckIn, 'id'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), checkIn);
    return docRef.id;
  },

  async getCheckIns(userId: string): Promise<CheckIn[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as CheckIn;
    });

    // Sort locally to avoid needing a Firestore composite index
    return results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },

  async updateCheckIn(id: string, data: Partial<CheckIn>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, data);
  },

  async deleteCheckIn(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
};
