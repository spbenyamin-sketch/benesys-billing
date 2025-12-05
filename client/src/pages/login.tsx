import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
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
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[LOGIN] ========== FORM SUBMITTED ==========");
    console.log("[LOGIN] Username state:", username);
    console.log("[LOGIN] Password state:", password);
    console.log("[LOGIN] Username length:", username.length);
    console.log("[LOGIN] Password length:", password.length);

    if (!username.trim() || !password.trim()) {
      console.log("[LOGIN] VALIDATION FAILED - Empty fields");
      toast({
        title: "Validation Error",
        description: "Username and password are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("[LOGIN] Sending login request to /api/login");

    try {
      const loginPayload = { username, password };
      console.log("[LOGIN] Payload:", loginPayload);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
        credentials: "include",
      });

      console.log("[LOGIN] Response received - status:", response.status);
      const responseData = await response.json();
      console.log("[LOGIN] Response body:", responseData);

      if (!response.ok) {
        console.error("[LOGIN] Login failed with status:", response.status);
        throw new Error(responseData.message || "Login failed");
      }

      console.log("[LOGIN] ✅ LOGIN SUCCESSFUL!");
      console.log("[LOGIN] User:", responseData.user);

      // Clear storage
      sessionStorage.removeItem("hasSelectedCompany");
      localStorage.removeItem("currentCompanyId");

      console.log("[LOGIN] Redirecting to home page...");
      window.location.href = "/";
    } catch (error: any) {
      console.error("[LOGIN] ❌ ERROR:", error.message);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log("[LOGIN] ========== REQUEST COMPLETE ==========");
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
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => {
                  const val = e.target.value;
                  console.log("[INPUT] Username changed to:", val);
                  setUsername(val);
                }}
                disabled={isLoading}
                autoComplete="username"
                data-testid="input-username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  console.log("[INPUT] Password changed (length):", val.length);
                  setPassword(val);
                }}
                disabled={isLoading}
                autoComplete="current-password"
                data-testid="input-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="text-xs text-gray-500 mt-4">
              Test credentials: admin / admin@123
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
