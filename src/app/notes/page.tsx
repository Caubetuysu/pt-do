import React from 'react';
import { NoteEditor } from '../../components/NoteEditor';

export default function NotesPage() {
  return (
    <div className="h-screen flex flex-col p-8 max-w-7xl mx-auto gap-8">
      <header className="border-b border-zinc-800 pb-6 shrink-0">
        <h1 className="text-4xl font-light tracking-tight text-zinc-100">
          Ghi chú <span className="text-zinc-500">kiến thức</span>
        </h1>
        <p className="text-zinc-400 mt-2">Ghi chép lại mọi thứ theo cách của bạn.</p>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden pb-4">
        {/* Sidebar Notes List */}
        <aside className="w-80 border border-zinc-800 rounded-xl bg-zinc-900/50 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900">
            <h2 className="font-medium text-zinc-200">Danh sách Ghi chú</h2>
            <button className="text-sm bg-zinc-800 text-zinc-300 hover:text-white px-3 py-1 rounded transition-colors">+</button>
          </div>
          <div className="overflow-y-auto p-4 space-y-2">
            {/* Mock Notes */}
            <div className="p-3 bg-zinc-800 rounded border border-zinc-700 cursor-pointer">
              <h3 className="font-medium text-zinc-200">Ý tưởng đồ án</h3>
              <p className="text-xs text-zinc-400 mt-1 line-clamp-1">Sử dụng Firebase và Next.js để làm hệ thống...</p>
            </div>
            <div className="p-3 bg-transparent hover:bg-zinc-800/50 rounded border border-transparent cursor-pointer transition-colors">
              <h3 className="font-medium text-zinc-400">Công thức Đạo hàm</h3>
              <p className="text-xs text-zinc-500 mt-1 line-clamp-1">sin(x)' = cos(x), cos(x)' = -sin(x)...</p>
            </div>
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 min-w-0">
          <NoteEditor />
        </main>
      </div>
    </div>
  );
}
