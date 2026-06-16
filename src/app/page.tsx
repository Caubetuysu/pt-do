import React from 'react';
import { TaskDashboard } from '@/components/TaskDashboard';
import { notion } from '@/lib/notion';
import { NotionPageRenderer } from '@/components/NotionPageRenderer';

export default async function Home() {
  // Fetch the Notion page the user requested
  let recordMap = null;
  try {
    recordMap = await notion.getPage('2bcdc2d8febf8034b58be40febbc3c89');
  } catch (error) {
    console.error('Failed to load Notion block for homepage', error);
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-y-auto px-16 lg:px-32 py-12 lg:py-24 max-w-5xl mx-auto w-full">
      {/* 1. The original Task Dashboard */}
      <TaskDashboard />

      {/* 2. The integrated NotionNext content */}
      <div className="mt-8 pt-8 border-t border-border">
        <h2 className="text-2xl font-bold text-foreground mb-6">Tích hợp Notion (Live Data)</h2>
        {recordMap ? (
          <div className="bg-background rounded-lg border border-border shadow-sm overflow-hidden">
            <NotionPageRenderer recordMap={recordMap} darkMode={true} />
          </div>
        ) : (
          <div className="p-8 text-center bg-secondary/50 rounded-lg border border-border">
            <p className="text-red-400">Không thể tải dữ liệu từ Notion. Vui lòng kiểm tra lại ID trang.</p>
          </div>
        )}
      </div>
    </div>
  );
}
