import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes fresh data cache
        gcTime: 1000 * 60 * 30, // 30 minutes garbage collection
        refetchOnWindowFocus: false, // Prevents background loading loops
        retry: 1, // Single fast retry
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent", // Automatically pre-fetches routes on link hover/touch!
    defaultPreloadDelay: 50, // 50ms delay before intent prefetching starts
    defaultPreloadStaleTime: 1000 * 60 * 10, // 10 minutes preload cache
    defaultPendingMs: 300, // Only show pending loading state if navigation takes > 300ms!
    defaultPendingMinMs: 400, // Show pending state for minimum 400ms to prevent visual flickering
    defaultStaleTime: 1000 * 60 * 5,
  });

  return router;
};
