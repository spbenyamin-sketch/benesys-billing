import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 0, // Always treat as stale - always fetch fresh
    refetchOnMount: "stale", // Refetch on mount if stale
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
