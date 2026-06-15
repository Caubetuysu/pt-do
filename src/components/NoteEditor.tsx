"use client";

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react';
import { Note } from '../types';

export function NoteEditor({ note }: { note?: Note | null }) {
  const [title, setTitle] = useState(note?.title || "Tiêu đề ghi chú...");

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: note?.content || '<p>Bắt đầu gõ ghi chú của bạn ở đây...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-zinc max-w-none min-h-[500px] focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && note) {
      if (editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content);
      }
      setTitle(note.title);
    }
  }, [note, editor]);

  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="border-b border-zinc-800 bg-zinc-900/50 p-4 flex gap-2">
        <button 
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor?.isActive('bold') ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          B
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium italic transition-colors ${editor?.isActive('italic') ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          I
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor?.isActive('heading', { level: 2 }) ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          H2
        </button>
        <button 
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${editor?.isActive('bulletList') ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'}`}
        >
          • List
        </button>
      </div>
      <div className="flex-1 p-8 bg-zinc-950 overflow-y-auto">
        <input 
          type="text" 
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="text-4xl font-bold bg-transparent border-none outline-none text-zinc-100 mb-6 w-full placeholder-zinc-700"
          placeholder="Tiêu đề..."
          readOnly={!note}
        />
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
