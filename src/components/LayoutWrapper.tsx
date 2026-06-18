"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { useStore } from '../store/useStore';
import { useFirebaseSync } from '../hooks/useFirebaseSync';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const isCollapsed = useStore(state => state.isSidebarCollapsed);
  const [userId, setUserId] = useState<string>("mock-user-123");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId("mock-user-123");
      }
    });
    return () => unsubscribe();
  }, []);

  // Run the sync hook
  useFirebaseSync(userId);

  return (
    <div className="min-h-screen bg-background text-foreground w-full flex">
      <Sidebar />
      <div 
        className={`flex-1 w-full min-h-screen relative transition-all duration-300 ${
          isCollapsed ? 'pl-20' : 'pl-64'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
