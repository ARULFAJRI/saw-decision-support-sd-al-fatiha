"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserRole } from "@/hooks/useAuth";
import { Loader2, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback,
}) => {
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();
  const router = useRouter();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setShouldRedirect(true);
      const timer = setTimeout(() => {
        router.push("/sign-in");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Authentication Required</h1>
        <p className="text-muted-foreground text-center mb-4">
          You need to be logged in to access this page.
        </p>
        <Alert className="max-w-md mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Redirecting to login page...
          </AlertDescription>
        </Alert>
        <Button onClick={() => router.push("/sign-in")}>
          Go to Login
        </Button>
      </div>
    );
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <Shield className="h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
        <p className="text-muted-foreground text-center mb-4">
          You don't have permission to access this page.
          {requiredRole === "admin" && " Admin access required."}
          {requiredRole === "guru" && " Teacher access required."}
        </p>
        <Alert className="max-w-md mb-4" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your current role: {user?.role || "Unknown"}
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          Go Back
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};