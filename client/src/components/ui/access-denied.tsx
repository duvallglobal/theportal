import { ShieldAlert } from "lucide-react";
import { Button } from "./button";
import { Link } from "wouter";

export function AccessDenied() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
      <div className="bg-muted/20 p-6 rounded-full mb-6">
        <ShieldAlert className="h-12 w-12 text-destructive" />
      </div>
      <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        You don't have permission to access this page. This area is restricted to administrators only.
      </p>
      <Link href="/dashboard">
        <Button>
          Return to Dashboard
        </Button>
      </Link>
    </div>
  );
}