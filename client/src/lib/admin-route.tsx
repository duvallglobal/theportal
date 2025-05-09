import { useEffect, useState } from "react";
import { Route, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { AccessDenied } from "@/components/ui/access-denied";
import { Loader2 } from "lucide-react";

export function AdminRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate("/auth");
      } else if (user.role !== "admin") {
        console.log("User is not admin:", user.role);
        setShowAccessDenied(true);
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      </Route>
    );
  }

  if (user.role !== "admin") {
    return (
      <Route path={path}>
        {showAccessDenied && <AccessDenied />}
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}