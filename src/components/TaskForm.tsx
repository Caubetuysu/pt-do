import React, { useState } from 'react';
import { taskService } from '../services/taskService';
import { Task } from '../types';

export function TaskForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [matrix, setMatrix] = useState<Task['eisenhowerMatrix']>('Q2');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;

    await taskService.addTask("mock-user-123", {
      title,
      description,
      dueDate: new Date(dueDate),
      eisenhowerMatrix: matrix,
      status: 'TODO',
      subtasks: [],
    });

    setTitle('');
    setDescription('');
    setDueDate('');
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
      <h3 className="text-lg font-medium text-zinc-200 mb-4">Tạo công việc mới</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-zinc-400 mb-1">Tên công việc</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 transition-colors"
            placeholder="VD: Ôn tập chương 3..."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Hạn chót (Deadline)</label>
            <input 
              type="datetime-local" 
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600 color-scheme-dark"
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Mức độ ưu tiên</label>
            <select 
              value={matrix}
              onChange={(e) => setMatrix(e.target.value as Task['eisenhowerMatrix'])}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-zinc-100 focus:outline-none focus:border-zinc-600"
            >
              <option value="Q1">Q1: Gấp & Quan trọng</option>
              <option value="Q2">Q2: Quan trọng (Không gấp)</option>
              <option value="Q3">Q3: Gấp (Không quan trọng)</option>
              <option value="Q4">Q4: Không gấp & Không quan trọng</option>
            </select>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-zinc-100 hover:bg-white text-zinc-900 font-medium py-2 rounded-md transition-colors mt-4"
        >
          Thêm Công Việc
        </button>
      </form>
    </div>
  );
}
