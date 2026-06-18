"use client";

import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { taskService } from '../../services/taskService';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Clock, 
  X,
  PlusCircle,
  LayoutGrid
} from 'lucide-react';
import { Task } from '../../types';

export default function MatrixPage() {
  const tasks = useStore(state => state.tasks);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [addingToQuadrant, setAddingToQuadrant] = useState<Task['eisenhowerMatrix'] | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUser?.uid || "mock-user-123";

  const q1 = tasks.filter(t => t.eisenhowerMatrix === 'Q1');
  const q2 = tasks.filter(t => t.eisenhowerMatrix === 'Q2');
  const q3 = tasks.filter(t => t.eisenhowerMatrix === 'Q3');
  const q4 = tasks.filter(t => t.eisenhowerMatrix === 'Q4');

  const handleToggleStatus = async (task: Task) => {
    const newStatus = task.status === 'DONE' ? 'TODO' : 'DONE';
    await taskService.updateTask(task.id, { status: newStatus });
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Xóa công việc này?")) {
      await taskService.deleteTask(id);
    }
  };

  const handleAddTask = async (quadrant: Task['eisenhowerMatrix']) => {
    if (!newTaskTitle.trim()) return;
    
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 3); // Default deadline: 3 days from now
    
    await taskService.addTask(userId, {
      title: newTaskTitle.trim(),
      description: '',
      dueDate,
      eisenhowerMatrix: quadrant,
      status: 'TODO',
      subtasks: []
    });

    setNewTaskTitle('');
    setAddingToQuadrant(null);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, targetQuadrant: Task['eisenhowerMatrix']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      await taskService.updateTask(taskId, { eisenhowerMatrix: targetQuadrant });
    }
  };

  const MatrixBox = ({ 
    quadrant, 
    title, 
    subtitle, 
    taskList, 
    borderClass, 
    badgeColor 
  }: { 
    quadrant: Task['eisenhowerMatrix'], 
    title: string, 
    subtitle: string, 
    taskList: Task[], 
    borderClass: string,
    badgeColor: string
  }) => {
    const isAdding = addingToQuadrant === quadrant;

    return (
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, quadrant)}
        className={`glass-panel rounded-2xl p-5 flex flex-col min-h-[350px] transition-all duration-300 ${borderClass} group/panel relative`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${badgeColor}`}></span>
              <h3 className="text-base font-bold text-white/90">{title}</h3>
            </div>
            <p className="text-[11px] text-white/40 font-medium mt-0.5">{subtitle}</p>
          </div>
          
          <button 
            onClick={() => {
              setAddingToQuadrant(isAdding ? null : quadrant);
              setNewTaskTitle('');
            }}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
            title="Thêm công việc nhanh"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Quick Add Input */}
        {isAdding && (
          <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex gap-2 bg-black/30 p-1.5 rounded-xl border border-white/10">
              <input
                autoFocus
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTask(quadrant);
                  if (e.key === 'Escape') setAddingToQuadrant(null);
                }}
                placeholder="Nhập nhiệm vụ..."
                className="flex-1 bg-transparent px-2 text-xs border-none outline-none text-white placeholder:text-white/30"
              />
              <button 
                onClick={() => handleAddTask(quadrant)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer"
              >
                LƯU
              </button>
            </div>
          </div>
        )}

        {/* Task List Container */}
        <div className="flex-1 space-y-2.5 overflow-y-auto pr-1">
          {taskList.map(task => {
            const isDone = task.status === 'DONE';
            const isOverdue = new Date(task.dueDate).getTime() < Date.now() && !isDone;

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                onClick={() => handleToggleStatus(task)}
                className={`bg-white/[0.02] border border-white/[0.04] rounded-xl p-3 flex items-start justify-between gap-3 cursor-grab hover:bg-white/[0.04] hover:border-white/10 transition-all active:scale-[0.98] group/item ${
                  isDone ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <button className="mt-0.5 shrink-0 text-white/40 group-hover/item:text-emerald-400 transition-colors">
                    {isDone ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    ) : (
                      <Circle className="w-4.5 h-4.5" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className={`text-xs font-semibold leading-tight text-white/80 group-hover/item:text-white transition-colors truncate ${
                      isDone ? 'line-through text-white/30' : ''
                    }`}>
                      {task.title}
                    </p>
                    
                    {/* Due Date Indicator */}
                    <div className="flex items-center gap-1 mt-1 text-[9px] font-bold">
                      {isOverdue ? (
                        <span className="text-red-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5 shrink-0" />
                          Trễ hạn
                        </span>
                      ) : (
                        <span className="text-white/30 flex items-center gap-0.5 group-hover/item:text-white/40 transition-colors">
                          <Calendar className="w-2.5 h-2.5 shrink-0" />
                          {new Date(task.dueDate).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDeleteTask(task.id, e)}
                  className="text-white/20 hover:text-red-400 p-1 rounded transition-colors cursor-pointer shrink-0 opacity-0 group-hover/item:opacity-100"
                  title="Xóa công việc"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}

          {taskList.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center py-12 text-white/20 select-none">
              <Sparkles className="w-8 h-8 mb-2 opacity-10" />
              <p className="text-[10px] font-semibold">Chưa có nhiệm vụ</p>
              <p className="text-[9px] opacity-60 mt-0.5 max-w-[140px] mx-auto">Kéo thả nhiệm vụ vào đây hoặc bấm +</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 max-w-7xl mx-auto flex flex-col gap-6 animate-in fade-in duration-300">
      <header className="border-b border-white/[0.06] pb-5 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <LayoutGrid className="w-6 h-6 text-emerald-400" />
            Ma trận Eisenhower
          </h1>
          <p className="text-xs text-white/40 font-medium mt-1">
            Kéo thả công việc giữa các góc phần tư để sắp xếp mức độ ưu tiên xử lý.
          </p>
        </div>
      </header>

      {/* Grid structure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">
        <MatrixBox 
          quadrant="Q1"
          title="Q1: Khẩn cấp & Quan trọng"
          subtitle="Làm ngay lập tức các nhiệm vụ này."
          taskList={q1}
          borderClass="border-red-500/20 neon-border-q1 hover:border-red-500/30"
          badgeColor="bg-red-400 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
        />
        
        <MatrixBox 
          quadrant="Q2"
          title="Q2: Quan trọng (Không khẩn cấp)"
          subtitle="Lên lịch để thực hiện sớm nhất."
          taskList={q2}
          borderClass="border-emerald-500/20 neon-border-q2 hover:border-emerald-500/30"
          badgeColor="bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
        />
        
        <MatrixBox 
          quadrant="Q3"
          title="Q3: Khẩn cấp (Không quan trọng)"
          subtitle="Ủy quyền hoặc giải quyết nhanh gọn."
          taskList={q3}
          borderClass="border-blue-500/20 neon-border-q3 hover:border-blue-500/30"
          badgeColor="bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
        />
        
        <MatrixBox 
          quadrant="Q4"
          title="Q4: Không khẩn cấp & Không quan trọng"
          subtitle="Xóa bỏ hoặc thực hiện lúc rảnh rỗi."
          taskList={q4}
          borderClass="border-white/[0.04] neon-border-q4 hover:border-white/10"
          badgeColor="bg-white/20"
        />
      </div>
    </div>
  );
}
