import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { UserInfo } from "@/lib/types";
import {
  LayoutDashboard,
  UserPlus,
  CreditCard,
  Calendar,
  MessageSquare,
  Upload,
  Target,
  User,
  Bell,
  Users,
  LogOut,
  X,
  LineChart,
  FileText,
  History,
  SendHorizontal,
} from "lucide-react";
// We'll replace Clerk's UserButton with our own user dropdown
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SidebarProps {
  id?: string;
  isOpen: boolean;
  className?: string;
  onClose: () => void;
  user: UserInfo | null;
  isAdmin: boolean;
}

export function Sidebar({
  id = "sidebar",
  isOpen,
  className = "",
  onClose,
  user,
  isAdmin,
}: SidebarProps) {
  const [location] = useLocation();
  
  // Fetch notifications to get unread count
  const { data: notifications = [] } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user, // Only fetch when user is logged in
  });
  
  // Count unread notifications
  const unreadCount = Array.isArray(notifications) 
    ? notifications.filter((n: any) => !n.isRead).length 
    : 0;

  // Define admin navigation items
  const adminNavItems = [
    {
      name: "Admin Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
    },
    {
      name: "Client Management",
      path: "/admin/client-management",
      icon: <Users className="w-5 h-5 mr-3" />,
    },
    {
      name: "Appointment Manager",
      path: "/admin/appointments",
      icon: <Calendar className="w-5 h-5 mr-3" />,
    },
    {
      name: "Content Viewer",
      path: "/admin/content-viewer",
      icon: <Upload className="w-5 h-5 mr-3" />,
    },
    {
      name: "Verification Queue",
      path: "/admin/verification-queue",
      icon: <UserPlus className="w-5 h-5 mr-3" />,
    },
    {
      name: "Billing Management",
      path: "/admin/billing-management",
      icon: <CreditCard className="w-5 h-5 mr-3" />,
    },
    {
      name: "Messaging",
      path: "/admin/messaging",
      icon: <MessageSquare className="w-5 h-5 mr-3" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "Communication Templates",
      path: "/admin/templates",
      icon: <FileText className="w-5 h-5 mr-3" />,
    },
    {
      name: "Communication History",
      path: "/admin/communication-history",
      icon: <History className="w-5 h-5 mr-3" />,
    },
    {
      name: "Send Communication",
      path: "/admin/send-communication",
      icon: <SendHorizontal className="w-5 h-5 mr-3" />,
    },
  ];

  // Define client navigation items
  const clientNavItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
    },
    {
      name: "Onboarding",
      path: "/onboarding",
      icon: <UserPlus className="w-5 h-5 mr-3" />,
    },
    {
      name: "Profile & Access",
      path: "/profile",
      icon: <User className="w-5 h-5 mr-3" />,
    },

    {
      name: "Content Upload",
      path: "/content-upload",
      icon: <Upload className="w-5 h-5 mr-3" />,
    },
    {
      name: "Billing",
      path: "/billing",
      icon: <CreditCard className="w-5 h-5 mr-3" />,
    },
    {
      name: "Appointments",
      path: "/appointments",
      icon: <Calendar className="w-5 h-5 mr-3" />,
    },
    {
      name: "Messaging",
      path: "/messages",
      icon: <MessageSquare className="w-5 h-5 mr-3" />,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      name: "Rent.Men Concierge",
      path: "/rent-men",
      icon: <Bell className="w-5 h-5 mr-3" />,
    },
    {
      name: "Analytics",
      path: "/analytics",
      icon: <LineChart className="w-5 h-5 mr-3" />,
    },
  ];

  // Use the appropriate nav items based on user role
  const navItems = isAdmin ? adminNavItems : clientNavItems;

  // Using the appropriate nav items based on role - no filtering needed
  const filteredNavItems = navItems;

  return (
    <div
      id={id}
      className={`w-64 h-screen flex flex-col bg-gray-900 text-white shadow-lg ${className}`}
    >
      {/* Fixed header section */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-semibold text-white">ManageTheFans</h1>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Scrollable navigation section */}
      <div className="flex-grow overflow-y-auto custom-scrollbar">
        <div className="p-4">
          <nav>
            <ul className="space-y-1">
              {filteredNavItems.map((item) => (
                <li key={item.path}>
                  <Link 
                    href={item.path}
                    className={`flex items-center px-3 py-2.5 rounded-md transition-colors ${
                      location === item.path
                        ? "bg-primary text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-2">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="font-semibold">MTF</span>
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">
              Manage The Fans
            </h4>
            <p className="text-xs text-gray-400">
              {user && user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : "Admin"} Portal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
