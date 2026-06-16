import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mutations, last_sync_time } = body;

    if (!mutations || !Array.isArray(mutations)) {
      return NextResponse.json({ error: 'Invalid mutations format' }, { status: 400 });
    }

    // Dùng Database Transaction để đảm bảo tính toàn vẹn
    await prisma.$transaction(async (tx: any) => {
      for (const mutation of mutations) {
        if (mutation.type === 'CREATE_TASK' || mutation.type === 'UPDATE_TASK') {
          await tx.task.upsert({
            where: { id: mutation.payload.id },
            update: { ...mutation.payload },
            create: { ...mutation.payload },
          });
        }
        if (mutation.type === 'CREATE_NOTE' || mutation.type === 'UPDATE_NOTE') {
          await tx.note.upsert({
            where: { id: mutation.payload.id },
            update: { ...mutation.payload },
            create: { ...mutation.payload },
          });
        }
      }
    });

    let serverChanges = {};
    if (last_sync_time) {
      const syncDate = new Date(last_sync_time);
      const updatedTasks = await prisma.task.findMany({
        where: { updated_at: { gt: syncDate } }
      });
      const updatedNotes = await prisma.note.findMany({
        where: { updated_at: { gt: syncDate } }
      });
      serverChanges = { tasks: updatedTasks, notes: updatedNotes };
    }

    return NextResponse.json({ success: true, serverChanges });

  } catch (error: any) {
    console.error("Sync Error:", error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
