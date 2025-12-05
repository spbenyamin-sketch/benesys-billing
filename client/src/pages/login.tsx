import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";

export default function Login() {
  const { toast } = useToast();
  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const username = usernameRef.current?.value || "";
    const password = passwordRef.current?.value || "";

    console.log("[LOGIN] Form submitted - username:", username, "password length:", password.length);

    if (!username.trim() || !password.trim()) {
      console.log("[LOGIN] Empty credentials");
      toast({
        title: "Error",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("[LOGIN] Starting login request...");
    
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      console.log("[LOGIN] Got response, status:", response.status);
      const data = await response.json();

      if (!response.ok) {
        console.log("[LOGIN] Login failed:", data.message);
        toast({
          title: "Login Failed",
          description: data.message || "Invalid username or password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      console.log("[LOGIN] Login successful! User:", data.user);
      
      // Clear session storage and redirect
      sessionStorage.removeItem("hasSelectedCompany");
      localStorage.removeItem("currentCompanyId");
      
      // Force redirect to home
      window.location.href = "/";
    } catch (error: any) {
      console.error("[LOGIN] Fetch error:", error);
      toast({
        title: "Login Error",
        description: error.message || "Network error occurred",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <LogIn className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Login</CardTitle>
              <CardDescription>Sign in to your account</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <Input
                ref={usernameRef}
                id="username"
                type="text"
                placeholder="Enter your username"
                data-testid="input-username"
                disabled={isLoading}
                autoComplete="username"
                defaultValue=""
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <Input
                ref={passwordRef}
                id="password"
                type="password"
                placeholder="Enter your password"
                data-testid="input-password"
                disabled={isLoading}
                autoComplete="current-password"
                defaultValue=""
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              data-testid="button-login"
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
