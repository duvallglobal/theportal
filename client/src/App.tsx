import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth, AuthProvider } from "@/hooks/use-auth";
import { useEffect } from "react";
import { SidebarLayout } from "./components/layouts/SidebarLayout";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import BrandStrategy from "./pages/BrandStrategy";
import ContentUpload from "./pages/ContentUpload";
import Billing from "./pages/Billing";
import Appointments from "./pages/Appointments";
import Messages from "./pages/Messages";
import RentMen from "./pages/RentMen";
import Analytics from "./pages/Analytics";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AuthPage from "./pages/auth-page";
import NotFound from "./pages/not-found";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserDetails from "./pages/admin/UserDetails";
import AppointmentManager from "./pages/admin/AppointmentManager";
import { ThemeProvider } from "next-themes";
import { AdminRoute } from "./lib/admin-route";
import { OnboardingProvider } from "./hooks/use-onboarding";
import { OnboardingTooltipContainer } from "./components/ui/onboarding-tooltip";
import { HelpButton } from "./components/ui/help-button";
import { MessagingProvider } from "./lib/context/MessagingProvider";

// Component to handle root path redirects
function RootRedirect() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading) {
      if (user) {
        navigate('/dashboard');
      } else {
        navigate('/auth');
      }
    }
  }, [user, isLoading, navigate]);
  
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

// Auth wrapper to protect routes
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
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

function Router() {
  return (
    <Switch>
      {/* Auth Routes */}
      <Route path="/auth">
        <AuthPage />
      </Route>
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
      
      <Route path="/analytics">
        <ProtectedRoute>
          <SidebarLayout>
            <Analytics />
          </SidebarLayout>
        </ProtectedRoute>
      </Route>

      {/* Admin Routes */}
      <AdminRoute path="/admin/dashboard" component={() => (
        <SidebarLayout>
          <AdminDashboard />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin" component={() => (
        <SidebarLayout>
          <AdminDashboard />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/users/:id" component={() => (
        <SidebarLayout>
          <UserDetails />
        </SidebarLayout>
      )} />
      
      <AdminRoute path="/admin/appointments" component={() => (
        <SidebarLayout>
          <AppointmentManager />
        </SidebarLayout>
      )} />

      {/* Redirect from root to auth or dashboard */}
      <Route path="/">
        <RootRedirect />
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
          <MessagingProvider>
            <OnboardingProvider>
              <TooltipProvider>
                <Router />
                <OnboardingTooltipContainer />
                <HelpButton />
                <Toaster />
              </TooltipProvider>
            </OnboardingProvider>
          </MessagingProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
