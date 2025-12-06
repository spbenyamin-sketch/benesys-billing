import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";

interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 0, // Always treat as stale - always fetch fresh
    refetchOnMount: "stale", // Refetch on mount if stale
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  return {
    user: user || undefined,
    isLoading,
    isAuthenticated: !!user,
  };
}
