"use client";

import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { taskService } from '../services/taskService';
import { noteService } from '../services/noteService';

export function useFirebaseSync(userId: string = "mock-user-123") {
  const { tasks, notes } = useStore();

  useEffect(() => {
    // Lắng nghe dữ liệu Tasks từ Firebase
    const unsubscribeTasks = taskService.subscribeToTasks(userId, (fetchedTasks) => {
      useStore.setState({ tasks: fetchedTasks });
    });

    // Lắng nghe dữ liệu Notes từ Firebase
    const unsubscribeNotes = noteService.subscribeToNotes(userId, (fetchedNotes) => {
      useStore.setState({ notes: fetchedNotes });
    });

    // Cleanup listeners khi component unmount
    return () => {
      unsubscribeTasks();
      unsubscribeNotes();
    };
  }, [userId]);

  return { tasks, notes };
}
