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
  increment
} from 'firebase/firestore';

export interface SharedTrip {
  id: string;
  name: string;
  creatorUid: string;
  memberUids: string[];
  createdAt: Date | null;
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
  async createTrip(creatorUid: string, name: string): Promise<string> {
    const ref = await addDoc(collection(db, TRIPS_COLLECTION), {
      name,
      creatorUid,
      memberUids: [creatorUid],
      createdAt: serverTimestamp(),
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
      createdAt: d.data().createdAt?.toDate() || null
    }) as SharedTrip);
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
  }
};
