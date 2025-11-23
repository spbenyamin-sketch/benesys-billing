import { useQuery } from "@tanstack/react-query";

export function useSetup() {
  const { data, isLoading } = useQuery({
    queryKey: ["/api/check-setup"],
    retry: false,
  });

  return {
    needsSetup: data?.needsSetup ?? false,
    isLoading,
  };
}
