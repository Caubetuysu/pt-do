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
  timestamp: Date;
  activityText: string;
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
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as CheckIn;
    });
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
