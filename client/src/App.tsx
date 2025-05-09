import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/context/AuthContext";
import { SignIn, SignUp } from "@clerk/clerk-react";
import SidebarLayout from "./components/layouts/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import BrandStrategy from "./pages/BrandStrategy";
import ContentUpload from "./pages/ContentUpload";
import Billing from "./pages/Billing";
import Appointments from "./pages/Appointments";
import Messages from "./pages/Messages";
import RentMen from "./pages/RentMen";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ClientManagement from "./pages/admin/ClientManagement";
import NotFound from "./pages/not-found";
import { ThemeProvider } from "next-themes";

// Auth wrapper to protect routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    navigate("/sign-in");
    return null;
  }
  
  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!isAdmin) {
    navigate("/dashboard");
    return null;
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/sign-in">
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <SignIn redirectUrl="/dashboard" />
        </div>
      </Route>
      <Route path="/sign-up">
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <SignUp redirectUrl="/onboarding" />
        </div>
      </Route>
      
      {/* Protected Client Routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <SidebarLayout>
            <Dashboard />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/onboarding">
        <ProtectedRoute>
          <SidebarLayout>
            <Onboarding />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <SidebarLayout>
            <Profile />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/brand-strategy">
        <ProtectedRoute>
          <SidebarLayout>
            <BrandStrategy />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/content-upload">
        <ProtectedRoute>
          <SidebarLayout>
            <ContentUpload />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/billing">
        <ProtectedRoute>
          <SidebarLayout>
            <Billing />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/appointments">
        <ProtectedRoute>
          <SidebarLayout>
            <Appointments />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/messages">
        <ProtectedRoute>
          <SidebarLayout>
            <Messages />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/rent-men">
        <ProtectedRoute>
          <SidebarLayout>
            <RentMen />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <Route path="/admin/dashboard">
        <AdminRoute>
          <SidebarLayout>
            <AdminDashboard />
          </SidebarLayout>
        </AdminRoute>
      </Route>
      <Route path="/admin/clients">
        <AdminRoute>
          <SidebarLayout>
            <ClientManagement />
          </SidebarLayout>
        </AdminRoute>
      </Route>

      {/* Redirect from root to dashboard */}
      <Route path="/">
        <ProtectedRoute>
          <SidebarLayout>
            <Dashboard />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>

      {/* 404 Fallback */}
      <Route>
        <NotFound />
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
