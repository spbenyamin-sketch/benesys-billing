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
import { LogIn, Loader2 } from "lucide-react";

export default function Login() {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const doLogin = async () => {
    console.log("[LOGIN] ========== BUTTON CLICKED ==========");
    console.log("[LOGIN] Username:", username);
    console.log("[LOGIN] Password length:", password.length);

    setErrorMessage("");

    if (!username.trim()) {
      setErrorMessage("Username is required");
      return;
    }
    if (!password.trim()) {
      setErrorMessage("Password is required");
      return;
    }

    setIsLoading(true);
    console.log("[LOGIN] Starting fetch to /api/login...");

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const payload = { username: username.trim(), password };
      console.log("[LOGIN] Sending fetch with payload:", JSON.stringify(payload));
      console.log("[LOGIN] Current URL:", window.location.href);
      console.log("[LOGIN] Request details - method: POST, path: /api/login, credentials: include");

      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log("[LOGIN] ✅ Fetch returned! Status:", response.status);
      console.log("[LOGIN] Response headers - content-type:", response.headers.get("content-type"));
      console.log("[LOGIN] Response cookies should be set (credentials: include)");

      const data = await response.json();
      console.log("[LOGIN] Response data:", data);

      if (!response.ok) {
        throw new Error(data.message || `Login failed (${response.status})`);
      }

      console.log("[LOGIN] SUCCESS! User:", data.user?.username);

      // Clear storage and redirect
      sessionStorage.removeItem("hasSelectedCompany");
      localStorage.removeItem("currentCompanyId");

      toast({
        title: "Login Successful",
        description: "Redirecting to dashboard...",
      });

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 500);

    } catch (error: any) {
      console.error("[LOGIN] ERROR:", error);
      
      let message = "Login failed";
      if (error.name === "AbortError") {
        message = "Request timed out. Please try again.";
      } else if (error.message) {
        message = error.message;
      }

      setErrorMessage(message);
      toast({
        title: "Login Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      doLogin();
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
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="username"
                autoFocus
                data-testid="input-username"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                autoComplete="current-password"
                data-testid="input-password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {errorMessage}
              </div>
            )}

            <Button
              type="button"
              className="w-full"
              disabled={isLoading}
              onClick={doLogin}
              data-testid="button-login"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
