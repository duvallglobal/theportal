import { ReactNode, useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Menu, Search, Bell, User, LogOut, ChevronDown, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  
  // Helper function to get user initials for avatar
  const getInitials = () => {
    if (user?.fullName) {
      const names = user.fullName.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[1][0]}`.toUpperCase();
      }
      return user.fullName[0].toUpperCase();
    }
    return user?.username ? user.username[0].toUpperCase() : "A";
  };
  
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
        {/* Admin Top Bar with enhanced design */}
        <header className="bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 shadow-lg sticky top-0 z-10">
          <div className="flex items-center justify-between py-3 px-4 max-w-screen-2xl mx-auto">
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
              {/* Enhanced Admin Search Bar */}
              <div className="relative hidden lg:block">
                <div className="flex items-center bg-gray-800 text-gray-300 rounded-md px-3 py-2 w-64 border border-gray-700 hover:border-gray-600 focus-within:border-blue-500 transition-colors">
                  <Search className="text-gray-400 h-4 w-4 mr-2 flex-shrink-0" />
                  <input
                    type="text"
                    placeholder="Search admin portal..."
                    className="bg-transparent border-none focus:outline-none focus:ring-0 w-full text-sm"
                  />
                </div>
              </div>
              
              {/* Notifications - Enhanced design */}
              <div className="relative">
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-9 w-9 border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600"
                >
                  <Bell className="h-4 w-4 text-gray-300" />
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
                    3
                  </span>
                </Button>
              </div>
              
              {/* Completely redesigned User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-full border border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600"
                  >
                    <Avatar className="h-8 w-8 border border-gray-600">
                      <AvatarFallback className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium">
                        {getInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start">
                      <span className="text-sm font-medium text-white line-clamp-1 max-w-[100px]">
                        {user.fullName || user.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {user.role === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-400 hidden md:block" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 bg-gray-800 border border-gray-700 text-white p-1 rounded-lg shadow-xl"
                >
                  <DropdownMenuLabel className="py-3 px-3 border-b border-gray-700 mb-1">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-white">Manage The Fans Portal</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin/profile')} 
                    className="flex items-center py-2 px-3 hover:bg-gray-700 focus:bg-gray-700 rounded-md my-1 cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4 text-blue-400" />
                    <span>My Profile</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    onClick={() => navigate('/admin/settings')} 
                    className="flex items-center py-2 px-3 hover:bg-gray-700 focus:bg-gray-700 rounded-md my-1 cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4 text-blue-400" />
                    <span>Account Settings</span>
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-gray-700 my-1" />
                  
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="flex items-center py-2 px-3 hover:bg-gray-700 focus:bg-gray-700 rounded-md mt-1 cursor-pointer text-red-400"
                  >
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