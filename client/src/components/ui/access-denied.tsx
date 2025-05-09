import { Button } from "@/components/ui/button";
import { ShieldAlert, Home } from "lucide-react";
import { Link } from "wouter";

export function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <ShieldAlert className="w-20 h-20 text-red-600 mb-6" />
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-8">
        You don&apos;t have permission to access this page. This area is restricted to admin users only.
      </p>
      <Link href="/">
        <Button className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}