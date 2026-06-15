"use client";

import { useFirebaseSync } from '../hooks/useFirebaseSync';

export function FirebaseSyncProvider({ children }: { children: React.ReactNode }) {
  // Hook này sẽ tự động chạy ngầm để kéo dữ liệu từ Firebase về Zustand
  useFirebaseSync("mock-user-123"); 
  return <>{children}</>;
}
