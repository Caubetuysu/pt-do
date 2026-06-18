"use client";

import React, { useState, useEffect } from 'react';
import { NoteEditor } from '../../components/NoteEditor';
import { useStore } from '../../store/useStore';
import { noteService } from '../../services/noteService';
import { auth } from '../../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  Plus, 
  Search, 
  Trash2, 
  BookOpen, 
  FileText, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Note } from '../../types';

export default function NotesPage() {
  const notes = useStore(state => state.notes);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const userId = currentUser?.uid || "mock-user-123";

  // Fallback mocks if empty
  const displayNotes: Note[] = notes.length > 0 ? notes : [
    { id: '1', title: 'Ý tưởng đồ án', content: '<p>Sử dụng Firebase và Next.js để làm hệ thống...</p>', tags: [], lastEditedAt: new Date() },
    { id: '2', title: 'Công thức Đạo hàm', content: '<p>sin(x)\' = cos(x), cos(x)\' = -sin(x)...</p>', tags: [], lastEditedAt: new Date() }
  ];

  const selectedNote = notes.find(n => n.id === selectedNoteId) || displayNotes.find(n => n.id === selectedNoteId) || null;

  const handleCreateNote = async () => {
    try {
      const newNote = await noteService.addNote(userId, {
        title: 'Ghi chú mới',
        content: '<p>Bắt đầu viết ghi chú tại đây...</p>',
        tags: []
      });
      setSelectedNoteId(newNote.id);
    } catch (e) {
      console.error("Failed to create note", e);
    }
  };

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Xóa ghi chú này?")) {
      try {
        await noteService.deleteNote(id);
        if (selectedNoteId === id) {
          setSelectedNoteId(null);
        }
      } catch (e) {
        console.error("Failed to delete note", e);
      }
    }
  };

  const filteredNotes = displayNotes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col p-8 max-w-7xl mx-auto gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <header className="border-b border-white/[0.06] pb-5 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Sổ tay kiến thức
          </h1>
          <p className="text-xs text-white/40 font-medium mt-1">
            Ghi chép và lưu trữ các bài học, công thức kiến thức quan trọng của bạn.
          </p>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex gap-6 overflow-hidden pb-4 min-h-0">
        
        {/* Sidebar Notes List */}
        <aside className="w-80 border border-white/[0.06] rounded-2xl bg-[#121214]/40 backdrop-blur-md flex flex-col overflow-hidden shrink-0 shadow-xl">
          {/* List Search & Control */}
          <div className="p-4 border-b border-white/[0.06] flex flex-col gap-3 bg-black/10 shrink-0">
            <div className="flex justify-between items-center">
              <h2 className="text-xs font-bold uppercase tracking-wider text-white/50">Tất cả ghi chú</h2>
              <button 
                onClick={handleCreateNote}
                className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-md shadow-emerald-950/20"
                title="Tạo ghi chú mới"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="flex items-center gap-2 bg-black/20 px-3 py-2 rounded-xl border border-white/10">
              <Search className="w-3.5 h-3.5 text-white/40" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm ghi chú..."
                className="bg-transparent border-none outline-none text-xs text-white placeholder:text-white/30 flex-1"
              />
            </div>
          </div>

          {/* List scroll area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredNotes.map(note => {
              const isSelected = selectedNoteId === note.id;
              // Strip HTML tags for content preview snippet
              const previewText = note.content.replace(/<[^>]+>/g, '') || "Trống";
              
              return (
                <div 
                  key={note.id}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between gap-3 group/note relative ${
                    isSelected 
                      ? 'bg-emerald-500/10 border-emerald-500/30 shadow-[0_4px_15px_rgba(16,185,129,0.04)]' 
                      : 'bg-transparent border-transparent hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-white/40 group-hover/note:text-white/60'}`} />
                    <div className="min-w-0">
                      <h3 className={`text-xs font-semibold truncate ${isSelected ? 'text-emerald-400' : 'text-white/80 group-hover/note:text-white'}`}>
                        {note.title}
                      </h3>
                      <p className="text-[10px] text-white/30 mt-1 line-clamp-1 group-hover/note:text-white/45">
                        {previewText}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center shrink-0">
                    <button
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="text-white/20 hover:text-red-400 p-1 rounded transition-colors opacity-0 group-hover/note:opacity-100 cursor-pointer"
                      title="Xóa ghi chú"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredNotes.length === 0 && (
              <div className="text-center text-white/20 py-16 flex flex-col items-center">
                <Sparkles className="w-8 h-8 mb-2 opacity-10" />
                <p className="text-[11px] font-semibold">Không tìm thấy ghi chú</p>
              </div>
            )}
          </div>
        </aside>

        {/* Editor Area */}
        <main className="flex-1 min-w-0 h-full overflow-hidden">
          {selectedNote ? (
            <NoteEditor note={selectedNote} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center border border-white/[0.06] rounded-2xl bg-[#121214]/20 text-white/30 text-xs font-semibold p-8 text-center">
              <BookOpen className="w-12 h-12 mb-3 opacity-10" />
              Chọn một ghi chú ở danh sách bên trái để bắt đầu học tập và ghi chép.
            </div>
          )}
        </main>

      </div>
    </div>
  );
}
