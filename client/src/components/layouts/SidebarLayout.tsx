import { useState, useEffect } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Menu, LogOut, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationsPopover } from "@/components/notifications/NotificationsPopover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        navigate('/sign-in');
      }
    });
  };

  // Close sidebar on route change on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById("sidebar");
      const sidebarToggle = document.getElementById("sidebar-toggle");

      if (
        sidebar &&
        sidebarToggle &&
        !sidebar.contains(event.target as Node) &&
        !sidebarToggle.contains(event.target as Node) &&
        window.innerWidth < 1024 &&
        isSidebarOpen
      ) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      {/* Fixed Sidebar */}
      <Sidebar
        id="sidebar"
        isOpen={isSidebarOpen}
        className={`fixed top-0 left-0 h-screen z-30 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        isAdmin={isAdmin}
      />

      {/* Main Content - Offset to accommodate fixed sidebar */}
      <div className="flex-1 flex flex-col w-full lg:ml-64">
        {/* Fixed Header */}
        <header className="bg-background z-20 border-b sticky top-0 left-0 right-0">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button
                id="sidebar-toggle"
                onClick={toggleSidebar}
                className="lg:hidden p-2 rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                aria-label="Toggle sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold lg:hidden">ManageTheFans</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative lg:block hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="bg-background-card border rounded-md pl-10 pr-4 py-2 w-64 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
                  />
                </div>
              </div>
              
              <NotificationsPopover />
              
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full" aria-label="User menu">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        {user?.fullName ? user.fullName.split(' ').map(name => name[0]).join('').toUpperCase() : 'U'}
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.fullName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page Content - Scrollable */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-background">{children}</main>
      </div>
    </div>
  );
}

// Adding default export for compatibility
export default SidebarLayout;
