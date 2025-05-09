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
} from "lucide-react";
// We'll replace Clerk's UserButton with our own user dropdown
import { ChevronDown } from "lucide-react";

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

  const navItems = [
    {
      name: "Dashboard",
      path: isAdmin ? "/admin/dashboard" : "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5 mr-3" />,
    },
    {
      name: "Onboarding",
      path: "/onboarding",
      icon: <UserPlus className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Profile & Access",
      path: "/profile",
      icon: <User className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Brand & Strategy",
      path: "/brand-strategy",
      icon: <Target className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Content Upload",
      path: "/content-upload",
      icon: <Upload className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Billing",
      path: "/billing",
      icon: <CreditCard className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Appointments",
      path: "/appointments",
      icon: <Calendar className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Messaging",
      path: "/messages",
      icon: <MessageSquare className="w-5 h-5 mr-3" />,
      badge: 3,
      adminOnly: false,
    },
    {
      name: "Rent.Men Concierge",
      path: "/rent-men",
      icon: <Bell className="w-5 h-5 mr-3" />,
      adminOnly: false,
    },
    {
      name: "Client Management",
      path: "/admin/clients",
      icon: <Users className="w-5 h-5 mr-3" />,
      adminOnly: true,
    },
  ];

  // Filter out admin-only items for non-admin users
  const filteredNavItems = navItems.filter(
    (item) => !item.adminOnly || (item.adminOnly && isAdmin)
  );

  return (
    <div
      id={id}
      className={`w-64 h-full bg-background-card shadow-lg ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-white">ManageTheFans</h1>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav>
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <Link 
                  href={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
                    location === item.path
                      ? "text-white bg-primary"
                      : "text-gray-300 hover:bg-background-lighter hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                  {item.badge && (
                    <span className="ml-auto bg-primary-light text-white text-xs font-semibold px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">
              {user?.fullName || "User"}
            </h4>
            <p className="text-xs text-gray-400">
              {user?.plan || "Basic Plan"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
