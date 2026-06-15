"use client";

import React, { useState } from 'react';
import { NoteEditor } from '../../components/NoteEditor';
import { useStore } from '../../store/useStore';
import { Note } from '../../types';

export default function NotesPage() {
  const notes = useStore(state => state.notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  // Mock notes if database is empty
  const displayNotes = notes.length > 0 ? notes : [
    { id: '1', title: 'Ý tưởng đồ án', content: '<p>Sử dụng Firebase và Next.js để làm hệ thống...</p>', userId: 'mock', lastEditedAt: new Date() },
    { id: '2', title: 'Công thức Đạo hàm', content: '<p>sin(x)\' = cos(x), cos(x)\' = -sin(x)...</p>', userId: 'mock', lastEditedAt: new Date() }
  ];

  const selectedNote = displayNotes.find(n => n.id === selectedNoteId) || null;

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
            {displayNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => setSelectedNoteId(note.id)}
                className={`p-3 rounded border cursor-pointer transition-colors ${
                  selectedNoteId === note.id 
                    ? 'bg-zinc-800 border-zinc-700' 
                    : 'bg-transparent border-transparent hover:bg-zinc-800/50'
                }`}
              >
                <h3 className={`font-medium ${selectedNoteId === note.id ? 'text-zinc-200' : 'text-zinc-400'}`}>
                  {note.title}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 line-clamp-1">
                  {note.content.replace(/<[^>]+>/g, '') || "Trống"}
                </p>
              </div>
            ))}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 min-w-0">
          {selectedNoteId ? (
            <NoteEditor note={selectedNote} />
          ) : (
            <div className="h-full flex items-center justify-center border border-zinc-800 rounded-xl bg-zinc-950/50 text-zinc-500">
              Chọn một ghi chú ở danh sách bên trái để xem và sửa.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
