import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Note } from '../types';

const NOTES_COLLECTION = 'notes';

export const noteService = {
  subscribeToNotes: (userId: string, callback: (notes: Note[]) => void) => {
    const q = query(collection(db, NOTES_COLLECTION), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        lastEditedAt: doc.data().lastEditedAt?.toDate() || new Date()
      })) as Note[];
      callback(notes);
    });
  },

  addNote: async (userId: string, note: Omit<Note, 'id' | 'lastEditedAt'>) => {
    const docRef = doc(collection(db, NOTES_COLLECTION));
    const newNote = {
      ...note,
      id: docRef.id,
      userId,
      lastEditedAt: new Date(),
    };
    await setDoc(docRef, newNote);
    return newNote;
  },

  updateNote: async (id: string, updates: Partial<Note>) => {
    const docRef = doc(db, NOTES_COLLECTION, id);
    const payload = { ...updates, lastEditedAt: new Date() };
    await updateDoc(docRef, payload);
  },

  deleteNote: async (id: string) => {
    const docRef = doc(db, NOTES_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
