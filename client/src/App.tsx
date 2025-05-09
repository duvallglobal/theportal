import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "./lib/context/AuthContext";
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
          <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center">Sign In</h1>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input 
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="email@example.com" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input 
                  id="password"
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="••••••••" 
                />
              </div>
              <button 
                type="button" 
                className="w-full py-2 px-4 bg-primary text-white rounded-md"
                onClick={() => console.log('Sign In clicked')}
              >
                Sign In
              </button>
            </form>
            <div className="text-center text-sm">
              Don't have an account? 
              <a href="/sign-up" className="text-primary ml-1">Sign Up</a>
            </div>
          </div>
        </div>
      </Route>
      <Route path="/sign-up">
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="w-full max-w-md p-6 space-y-6 bg-card rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-center">Create Account</h1>
            <form className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">Full Name</label>
                <input 
                  id="fullName"
                  type="text"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="John Doe" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input 
                  id="email"
                  type="email"
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="email@example.com" 
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input 
                  id="password"
                  type="password" 
                  className="w-full px-3 py-2 border rounded-md bg-background"
                  placeholder="••••••••" 
                />
              </div>
              <button 
                type="button" 
                className="w-full py-2 px-4 bg-primary text-white rounded-md"
                onClick={() => console.log('Sign Up clicked')}
              >
                Create Account
              </button>
            </form>
            <div className="text-center text-sm">
              Already have an account? 
              <a href="/sign-in" className="text-primary ml-1">Sign In</a>
            </div>
          </div>
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
        <TooltipProvider>
          <Router />
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
