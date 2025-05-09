import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useEffect } from "react";
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
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import NotFound from "./pages/not-found";
import { ThemeProvider } from "next-themes";

// Auth wrapper to protect routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/sign-in");
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return <>{children}</>;
}

// Admin route wrapper
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      navigate("/dashboard");
    }
  }, [user, isLoading, navigate]);
  
  if (isLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (user.role !== "admin") {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/sign-in">
        <SignIn />
      </Route>
      <Route path="/sign-up">
        <SignUp />
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

      {/* Admin Routes - Temporarily removed */}

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
        <AuthProvider>
          <TooltipProvider>
            <Router />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
