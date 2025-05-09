import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading } = useAuth();
  
  // While loading, show a minimal loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  // If not an admin, redirect to login
  if (!user || user.role !== 'admin') {
    return <Redirect to="/auth" />;
  }
  
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - visible on large screens, hidden on mobile until toggled */}
      <div className={`fixed inset-0 z-20 transition-opacity duration-300 ${
        sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto"
      }`}>
        <div className="absolute inset-0 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          isAdmin={true}
          className="relative z-10"
        />
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col lg:ml-64">
        {/* Top bar with menu toggle */}
        <header className="bg-background-card p-4 shadow-md flex items-center justify-between">
          <button
            className="p-2 rounded-md text-white hover:bg-background-lighter lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
            <span className="sr-only">Open sidebar</span>
          </button>
          <h1 className="text-xl font-semibold text-white">Admin Portal</h1>
          <div></div> {/* Empty div for flex spacing */}
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}