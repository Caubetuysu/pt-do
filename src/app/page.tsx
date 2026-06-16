"use client";

import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { taskService } from '../services/taskService';
import { 
  ListTodo, 
  CheckSquare, 
  Square,
  ListFilter,
  ArrowUpDown,
  Zap,
  Search,
  Maximize2,
  MoreHorizontal,
  ChevronDown,
  Plus
} from 'lucide-react';

export default function Dashboard() {
  const tasks = useStore(state => state.tasks);
  const [mounted, setMounted] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const handleAddTask = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskTitle.trim()) {
      // Default new task with a due date 7 days from now just to have data
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);
      
      await taskService.addTask("mock-user-123", {
        title: newTaskTitle.trim(),
        description: '',
        dueDate: dueDate,
        eisenhowerMatrix: 'Q2',
        status: 'TODO',
        subtasks: [],
      });
      setNewTaskTitle('');
      setIsAdding(false);
    }
  };

  const formatDateRange = (date: Date) => {
    const start = new Date(); // Mock start date as today for the UI like the screenshot
    const end = new Date(date);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);
    
    // Some mock logic to match screenshot look
    if (end.getFullYear() > 2026) {
      return endStr;
    }
    return `${startStr} → ${endStr}`;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background px-16 lg:px-32 py-12 lg:py-24 max-w-5xl mx-auto w-full">
      {/* Header */}
      <header className="mb-8">
        <div className="w-16 h-16 mb-6">
          <ListTodo className="w-full h-full text-emerald-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-[40px] font-bold text-foreground tracking-tight">
          Nhiệm vụ hằng ngày
        </h1>
      </header>

      {/* Toolbar */}
      <div className="flex justify-between items-center mb-1 border-b border-border pb-2">
        <div className="flex gap-4">
          <button className="flex items-center gap-2 text-sm font-medium text-foreground px-2 py-1 bg-secondary/50 rounded">
            <ListTodo className="w-4 h-4" />
            Tasks
          </button>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          {/* Unclickable fake buttons removed per user request */}
        </div>
      </div>

      {/* List */}
      <div className="flex flex-col">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="group flex items-center justify-between py-[6px] border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3 flex-1 overflow-hidden">
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                {task.status === 'DONE' ? (
                  <CheckSquare className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Square className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
                )}
              </div>
              <span className={`text-[15px] truncate font-medium ${task.status === 'DONE' ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                {task.title}
              </span>
            </div>
            
            <div className="text-sm text-muted-foreground whitespace-nowrap pl-4 opacity-80 group-hover:opacity-100 transition-opacity">
              {formatDateRange(task.dueDate)}
            </div>
          </div>
        ))}

        {/* Inline New Task Input */}
        <div className="flex items-center py-[6px] mt-1 text-muted-foreground group">
          {isAdding ? (
            <div className="flex items-center gap-3 w-full">
              <div className="w-6 flex items-center justify-center flex-shrink-0">
                <Square className="w-4 h-4 opacity-50" />
              </div>
              <input
                autoFocus
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={handleAddTask}
                onBlur={() => {
                  if (!newTaskTitle.trim()) setIsAdding(false);
                }}
                placeholder="Type a task and press Enter..."
                className="flex-1 bg-transparent border-none outline-none text-[15px] text-foreground placeholder:text-muted-foreground"
              />
            </div>
          ) : (
            <button 
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 hover:bg-secondary px-2 py-1 rounded transition-colors -ml-2"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[15px]">New task</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
