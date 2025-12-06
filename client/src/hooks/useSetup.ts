import { useQuery } from "@tanstack/react-query";

interface SetupCheckResponse {
  needsSetup: boolean;
}

export function useSetup() {
  const { data, isLoading, error } = useQuery<SetupCheckResponse>({
    queryKey: ["/api/check-setup"],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 0, // Always fresh - setup status shouldn't be cached
  });

  // If there's an error or no data yet, still show loading (don't default to false)
  if (isLoading || !data) {
    return {
      needsSetup: false,
      isLoading: true,
    };
  }

  return {
    needsSetup: data.needsSetup === true,
    isLoading: false,
  };
}
