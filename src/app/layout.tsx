import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { FirebaseSyncProvider } from "@/components/FirebaseSyncProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PT.DO - Quản lý Deadline & Ghi chú",
  description: "Ứng dụng To-Do List & Deadline Management cho sinh viên",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <FirebaseSyncProvider>
          <div className="flex">
            <Sidebar />
            <main className="flex-1 ml-64 bg-zinc-950 text-zinc-50 min-h-screen">
              {children}
            </main>
          </div>
        </FirebaseSyncProvider>
      </body>
    </html>
  );
}
