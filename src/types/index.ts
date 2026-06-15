export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  eisenhowerMatrix: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  subtasks: Subtask[];
  createdAt: Date;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string; // HTML from Tiptap
  tags: string[];
  linkedTaskId?: string;
  lastEditedAt: Date;
}
