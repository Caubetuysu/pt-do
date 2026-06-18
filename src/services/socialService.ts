import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  increment,
  onSnapshot,
  Unsubscribe,
  limit,
  Timestamp
} from 'firebase/firestore';
import { diaryService, CheckIn } from './diaryService';

export interface SharedTrip {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[];
  createdAt: Date | null;
  startDate: Date | null; // Trip starts from this date (can be set to past)
  endDate: Date | null;   // null = still active
  isActive: boolean;
}

export interface Reaction {
  checkInId: string;
  uid: string;
  type: '❤️' | '🔥' | '😂' | '😮' | '👏';
}

export interface Comment {
  id: string;
  checkInId: string;
  uid: string;
  displayName: string;
  photoURL: string;
  text: string;
  createdAt: Date | null;
}

const TRIPS_COLLECTION = 'shared_trips';
const REACTIONS_COLLECTION = 'reactions';
const COMMENTS_COLLECTION = 'comments';

export const socialService = {
  // --- Shared Trips ---
  async createTrip(creatorUid: string, name: string, startDate?: Date): Promise<string> {
    const ref = await addDoc(collection(db, TRIPS_COLLECTION), {
      name,
      creatorUid,
      memberUids: [creatorUid],
      createdAt: serverTimestamp(),
      startDate: startDate ? Timestamp.fromDate(startDate) : serverTimestamp(),
      endDate: null,
      isActive: true
    });
    return ref.id;
  },

  async joinTrip(tripId: string, uid: string): Promise<void> {
    const ref = doc(db, TRIPS_COLLECTION, tripId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Chuyến đi không tồn tại');
    const data = snap.data();
    if (!data.memberUids.includes(uid)) {
      await updateDoc(ref, { memberUids: [...data.memberUids, uid] });
    }
  },

  async getMyTrips(uid: string): Promise<SharedTrip[]> {
    const q = query(collection(db, TRIPS_COLLECTION), where('memberUids', 'array-contains', uid));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || null,
      startDate: d.data().startDate?.toDate() || null,
      endDate: d.data().endDate?.toDate() || null,
    }) as SharedTrip);
  },

  async endTrip(tripId: string): Promise<void> {
    await updateDoc(doc(db, TRIPS_COLLECTION, tripId), {
      isActive: false,
      endDate: serverTimestamp()
    });
  },

  async updateTripStartDate(tripId: string, startDate: Date): Promise<void> {
    await updateDoc(doc(db, TRIPS_COLLECTION, tripId), {
      startDate: Timestamp.fromDate(startDate)
    });
  },

  // --- Reactions ---
  async toggleReaction(checkInId: string, uid: string, type: Reaction['type']): Promise<void> {
    const reactionId = `${checkInId}_${uid}`;
    const ref = doc(db, REACTIONS_COLLECTION, reactionId);
    const snap = await getDoc(ref);
    if (snap.exists() && snap.data().type === type) {
      // Same emoji = remove reaction
      await deleteDoc(ref);
    } else {
      await setDoc(ref, { checkInId, uid, type });
    }
  },

  async getReactions(checkInId: string): Promise<Reaction[]> {
    const q = query(collection(db, REACTIONS_COLLECTION), where('checkInId', '==', checkInId));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as Reaction);
  },

  // --- Comments ---
  async addComment(checkInId: string, uid: string, displayName: string, photoURL: string, text: string): Promise<void> {
    await addDoc(collection(db, COMMENTS_COLLECTION), {
      checkInId,
      uid,
      displayName,
      photoURL,
      text,
      createdAt: serverTimestamp()
    });
  },

  async getComments(checkInId: string): Promise<Comment[]> {
    const q = query(collection(db, COMMENTS_COLLECTION), where('checkInId', '==', checkInId));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate() || null
    }) as Comment).sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  },

  async deleteComment(commentId: string): Promise<void> {
    await deleteDoc(doc(db, COMMENTS_COLLECTION, commentId));
  },

  // --- Live Trip Feed ---
  subscribeToTripFeed(
    trip: SharedTrip,
    callback: (items: { uid: string; checkIn: CheckIn }[]) => void
  ): Unsubscribe {
    const q = query(
      collection(db, 'travel_diary'),
      where('userId', 'in', trip.memberUids.slice(0, 10)),
      limit(100)
    );

    return onSnapshot(q, (snap) => {
      const startMs = trip.startDate ? trip.startDate.getTime() : 0;
      const endMs = trip.endDate ? trip.endDate.getTime() : Date.now() + 999999999;

      const items = snap.docs
        .map(d => {
          const data = d.data();
          const timestamp: Date = data.timestamp?.toDate() || new Date();
          return {
            uid: data.userId as string,
            checkIn: {
              id: d.id,
              ...data,
              timestamp,
            } as CheckIn
          };
        })
        // Filter to only check-ins within the trip's time window
        .filter(item => {
          const t = item.checkIn.timestamp.getTime();
          return t >= startMs && t <= endMs;
        })
        .sort((a, b) => b.checkIn.timestamp.getTime() - a.checkIn.timestamp.getTime())
        .slice(0, 50);
      callback(items);
    });
  },

  async getTripMembers(trip: SharedTrip): Promise<{ uid: string; displayName: string; photoURL: string }[]> {
    // Return basic info from memberUids — caller fetches from userService
    return trip.memberUids.map(uid => ({ uid, displayName: uid, photoURL: '' }));
  }
};
