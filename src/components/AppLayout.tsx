import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <div className="relative min-h-screen flex w-full overflow-hidden bg-background">
        {/* Global Fixed Background Canvas */}
        <div 
          className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat w-full h-full pointer-events-none"
          style={{ backgroundImage: "url('/background.jpeg')" }}
        />
        {/* Ambient Dark/Glow Overlay */}
        <div className="fixed inset-0 z-0 bg-gradient-to-br from-black/5 via-transparent to-black/10 dark:from-black/20 dark:to-black/40 pointer-events-none" />
        
        <AppSidebar />
        
        <div className="relative z-10 flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-4 md:p-6 overflow-auto relative glass-scrollbar">
            <div className="max-w-[1600px] mx-auto w-full h-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
