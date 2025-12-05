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
      console.log("[LOGIN] Payload:", JSON.stringify(loginPayload));

      console.log("[LOGIN] Calling fetch()...");
      
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginPayload),
        credentials: "include",
      });

      console.log("[LOGIN] ✅ Fetch completed! Status:", response.status);
      
      let responseData;
      try {
        responseData = await response.json();
        console.log("[LOGIN] Response body:", responseData);
      } catch (parseErr) {
        console.error("[LOGIN] Failed to parse response JSON:", parseErr);
        throw new Error("Server returned invalid response");
      }

      if (!response.ok) {
        console.error("[LOGIN] Login failed - server returned error");
        console.error("[LOGIN] Status:", response.status);
        console.error("[LOGIN] Message:", responseData.message);
        throw new Error(responseData.message || `Login failed (${response.status})`);
      }

      console.log("[LOGIN] ✅✅✅ LOGIN SUCCESSFUL!");
      console.log("[LOGIN] User:", responseData.user);

      // Clear storage
      sessionStorage.removeItem("hasSelectedCompany");
      localStorage.removeItem("currentCompanyId");

      console.log("[LOGIN] Redirecting to home page...");
      
      // Use window.location to force a reload
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (error: any) {
      console.error("[LOGIN] ❌ ERROR CAUGHT:", error);
      console.error("[LOGIN] Error message:", error.message);
      console.error("[LOGIN] Error stack:", error.stack);
      
      setIsLoading(false);
      
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials or network error",
        variant: "destructive",
      });
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
                  setUsername(e.target.value);
                  console.log("[INPUT] Username changed to:", e.target.value);
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
                  setPassword(e.target.value);
                  console.log("[INPUT] Password changed (length):", e.target.value.length);
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

            <div className="text-xs text-gray-500 mt-4 bg-gray-100 p-2 rounded">
              Test: admin / admin@123
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
