"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useEffect, useState, useRef } from 'react';
import { Note } from '../types';
import { noteService } from '../services/noteService';
import { 
  Bold, 
  Italic, 
  Heading2, 
  List, 
  Save, 
  Check, 
  Loader2 
} from 'lucide-react';

export function NoteEditor({ note }: { note: Note }) {
  const [title, setTitle] = useState(note.title);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: note.content,
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-zinc max-w-none min-h-[450px] focus:outline-none text-white/80 leading-relaxed text-sm font-medium',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      triggerAutoSave({ content: html });
    }
  });

  // Sync state when active note changes
  useEffect(() => {
    if (editor && note) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content);
      }
      setTitle(note.title);
      setSaveStatus('saved');
    }
  }, [note.id, editor]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const triggerAutoSave = (updates: Partial<Note>) => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await noteService.updateNote(note.id, updates);
        setSaveStatus('saved');
      } catch (e) {
        console.error("Auto-save failed", e);
        setSaveStatus('error');
      }
    }, 1000); // Debounce database saves for 1 second
  };

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    triggerAutoSave({ title: newTitle });
  };

  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleHeading = () => editor?.chain().focus().toggleHeading({ level: 2 }).run();
  const toggleBulletList = () => editor?.chain().focus().toggleBulletList().run();

  return (
    <div className="bg-[#121214]/40 border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col h-full shadow-2xl backdrop-blur-md">
      
      {/* Editor Toolbar */}
      <div className="border-b border-white/[0.06] bg-black/20 p-3 flex justify-between items-center shrink-0">
        <div className="flex gap-1.5">
          <button 
            onClick={toggleBold}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              editor?.isActive('bold') 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)] font-bold' 
                : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
            title="In đậm"
          >
            <Bold className="w-4 h-4" />
          </button>
          
          <button 
            onClick={toggleItalic}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              editor?.isActive('italic') 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
            title="In nghiêng"
          >
            <Italic className="w-4 h-4" />
          </button>
          
          <button 
            onClick={toggleHeading}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              editor?.isActive('heading', { level: 2 }) 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
            title="Tiêu đề H2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          
          <button 
            onClick={toggleBulletList}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              editor?.isActive('bulletList') 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.05)]' 
                : 'text-white/50 hover:text-white hover:bg-white/[0.04] border border-transparent'
            }`}
            title="Danh sách dấu chấm"
          >
            <List className="w-4 h-4" />
          </button>
        </div>

        {/* Sync/Auto-save status indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.03] border border-white/[0.05] rounded-xl text-[10px] text-white/40 font-semibold select-none">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
              <span>Đang lưu...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đã lưu tự động</span>
            </>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-400">Lỗi lưu dữ liệu</span>
          )}
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 p-6 overflow-y-auto min-h-0 bg-transparent flex flex-col">
        <input 
          type="text" 
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none text-white/95 mb-5 w-full placeholder:text-white/20 select-text"
          placeholder="Tiêu đề ghi chú..."
        />
        <div className="flex-1 min-h-[400px] cursor-text" onClick={() => editor?.commands.focus()}>
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
