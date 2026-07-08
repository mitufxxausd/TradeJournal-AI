import type { ReactNode } from "react";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#09090b] flex">
      <Sidebar />
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
