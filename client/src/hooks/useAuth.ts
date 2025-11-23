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
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
