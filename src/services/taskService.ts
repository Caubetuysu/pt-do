import { collection, doc, setDoc, updateDoc, deleteDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Task } from '../types';

const TASKS_COLLECTION = 'tasks';

export const taskService = {
  subscribeToTasks: (userId: string, callback: (tasks: Task[]) => void) => {
    const q = query(collection(db, TASKS_COLLECTION), where("userId", "==", userId));
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        dueDate: doc.data().dueDate?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Task[];
      callback(tasks);
    });
  },

  addTask: async (userId: string, task: Omit<Task, 'id' | 'createdAt'>) => {
    const docRef = doc(collection(db, TASKS_COLLECTION));
    const newTask = {
      ...task,
      id: docRef.id,
      userId,
      createdAt: new Date(),
    };
    await setDoc(docRef, newTask);
    return newTask;
  },

  updateTask: async (id: string, updates: Partial<Task>) => {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await updateDoc(docRef, updates);
  },

  deleteTask: async (id: string) => {
    const docRef = doc(db, TASKS_COLLECTION, id);
    await deleteDoc(docRef);
  }
};
