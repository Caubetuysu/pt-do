import { db } from '../lib/firebase';
import { 
  doc, 
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { diaryService, CheckIn } from './diaryService';
import { UserProfile } from './userService';

export interface FriendRequest {
  fromUid: string;
  fromName: string;
  fromPhoto: string;
  toUid: string;
  status: 'pending' | 'accepted';
  createdAt: Date | null;
}

export interface Friend extends UserProfile {
  friendSince: Date | null;
}

const FRIENDS_COLLECTION = 'friendships';
const REQUESTS_COLLECTION = 'friend_requests';

export const friendService = {
  // Send a friend request
  async sendRequest(fromUid: string, fromName: string, fromPhoto: string, toUid: string): Promise<void> {
    if (fromUid === toUid) throw new Error('Không thể kết bạn với chính mình');
    
    // Check if already friends
    const existingFriend = await getDoc(doc(db, FRIENDS_COLLECTION, fromUid, 'friends', toUid));
    if (existingFriend.exists()) throw new Error('Đã là bạn bè rồi');

    const ref = doc(db, REQUESTS_COLLECTION, toUid, 'incoming', fromUid);
    await setDoc(ref, {
      fromUid,
      fromName,
      fromPhoto,
      toUid,
      status: 'pending',
      createdAt: serverTimestamp()
    });
  },

  // Get pending friend requests for a user
  async getIncomingRequests(uid: string): Promise<FriendRequest[]> {
    const q = query(collection(db, REQUESTS_COLLECTION, uid, 'incoming'), where('status', '==', 'pending'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), createdAt: d.data().createdAt?.toDate() || null }) as FriendRequest);
  },

  // Accept a friend request
  async acceptRequest(myUid: string, fromUid: string): Promise<void> {
    // Add each other as friends
    await setDoc(doc(db, FRIENDS_COLLECTION, myUid, 'friends', fromUid), {
      since: serverTimestamp()
    });
    await setDoc(doc(db, FRIENDS_COLLECTION, fromUid, 'friends', myUid), {
      since: serverTimestamp()
    });
    
    // Delete the request
    await deleteDoc(doc(db, REQUESTS_COLLECTION, myUid, 'incoming', fromUid));
  },

  // Decline a friend request
  async declineRequest(myUid: string, fromUid: string): Promise<void> {
    await deleteDoc(doc(db, REQUESTS_COLLECTION, myUid, 'incoming', fromUid));
  },

  // Get all friends UIDs
  async getFriendUIDs(uid: string): Promise<string[]> {
    const snap = await getDocs(collection(db, FRIENDS_COLLECTION, uid, 'friends'));
    return snap.docs.map(d => d.id);
  },

  // Unfriend
  async unfriend(myUid: string, friendUid: string): Promise<void> {
    await deleteDoc(doc(db, FRIENDS_COLLECTION, myUid, 'friends', friendUid));
    await deleteDoc(doc(db, FRIENDS_COLLECTION, friendUid, 'friends', myUid));
  },

  // Get check-ins for a friend (only public ones)
  async getFriendCheckIns(friendUid: string): Promise<CheckIn[]> {
    return diaryService.getCheckIns(friendUid);
  }
};
