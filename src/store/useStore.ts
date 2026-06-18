import { create } from 'zustand';
import { Task, Note } from '../types';

interface AppState {
  tasks: Task[];
  notes: Note[];
  isSidebarCollapsed: boolean;
  
  // Modal states
  showWrapUp: boolean;
  showFriends: boolean;
  showStats: boolean;
  triggerLocate: number;
  triggerPin: number;

  // Task Actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Note Actions
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;

  // Sidebar Actions
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // New Actions
  setShowWrapUp: (show: boolean) => void;
  setShowFriends: (show: boolean) => void;
  setShowStats: (show: boolean) => void;
  setTriggerLocate: () => void;
  setTriggerPin: () => void;
}

export const useStore = create<AppState>((set) => ({
  tasks: [],
  notes: [],
  isSidebarCollapsed: false,
  showWrapUp: false,
  showFriends: false,
  showStats: false,
  triggerLocate: 0,
  triggerPin: 0,

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
  })),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  toggleSubtask: (taskId, subtaskId) => set((state) => ({
    tasks: state.tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          subtasks: t.subtasks.map(st => 
            st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
          )
        };
      }
      return t;
    })
  })),

  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  
  updateNote: (id, updates) => set((state) => ({
    notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n)
  })),

  deleteNote: (id) => set((state) => ({
    notes: state.notes.filter(n => n.id !== id)
  })),

  setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
  setShowWrapUp: (show) => set({ showWrapUp: show }),
  setShowFriends: (show) => set({ showFriends: show }),
  setShowStats: (show) => set({ showStats: show }),
  setTriggerLocate: () => set((state) => ({ triggerLocate: state.triggerLocate + 1 })),
  setTriggerPin: () => set((state) => ({ triggerPin: state.triggerPin + 1 })),
}));
