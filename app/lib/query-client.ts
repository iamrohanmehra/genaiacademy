import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";
import { ApiError } from "~/lib/api.client";

function handleGlobalError(error: Error) {
    if (error instanceof ApiError && error.status === 401) {
        // Redirect to login on 401
        if (typeof window !== "undefined") {
            window.location.href = "/login";
        }
    }
}

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
    queryCache: new QueryCache({
        onError: handleGlobalError,
    }),
    mutationCache: new MutationCache({
        onError: handleGlobalError,
    }),
});
