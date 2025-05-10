import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Menu, Search, Bell, User, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isLoading, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/auth');
      }
    });
  };
  
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
    <div className="flex h-screen bg-gray-950">
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
        {/* Top bar with menu toggle - Improved styling */}
        <header className="bg-gray-900 border-b border-gray-800 shadow-md sticky top-0 z-10">
          <div className="flex items-center justify-between p-3 px-4 max-w-screen-2xl mx-auto">
            <div className="flex items-center">
              <button
                className="p-2 rounded-md text-white hover:bg-gray-800 lg:hidden mr-3"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open sidebar</span>
              </button>
              
              {/* Show this breadcrumb/title on pages other than dashboard */}
              {location !== '/admin/dashboard' && (
                <div className="flex items-center">
                  <Link href="/admin/dashboard" className="text-gray-400 hover:text-white">
                    Back to Admin Dashboard
                  </Link>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Improved Search Bar */}
              <div className="relative hidden lg:block">
                <div className="flex items-center bg-gray-800 text-gray-300 rounded-md pl-3 pr-4 py-2 w-64 border border-gray-700 focus-within:border-primary">
                  <Search className="text-gray-400 h-4 w-4 mr-2" />
                  <input
                    type="text"
                    placeholder="Search clients..."
                    className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm"
                  />
                </div>
              </div>
              
              {/* Notifications - Dynamic badge */}
              <div className="relative">
                <Button variant="ghost" size="icon" className="relative rounded-full p-2 hover:bg-gray-800">
                  <Bell className="h-5 w-5 text-gray-300" />
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    0
                  </span>
                </Button>
              </div>
              
              {/* Enhanced User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 px-3 py-2 rounded-md border border-gray-700 hover:bg-gray-800">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                      <span className="font-semibold">MTF</span>
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium text-white">{user.fullName || "Admin User"}</p>
                      <p className="text-xs text-gray-400">{user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Admin"}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-gray-900 border border-gray-700 text-white">
                  <DropdownMenuLabel className="pb-2 border-b border-gray-700">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-white">Manage The Fans Portal</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/admin/profile')} className="hover:bg-gray-800 text-gray-200 focus:bg-gray-800 focus:text-white mt-1">
                    <User className="mr-2 h-4 w-4" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuItem onClick={handleLogout} className="hover:bg-gray-800 text-gray-200 focus:bg-gray-800 focus:text-white">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main content area */}
        <main className="flex-1 overflow-auto p-6 bg-gray-950">
          {children}
        </main>
      </div>
    </div>
  );
}