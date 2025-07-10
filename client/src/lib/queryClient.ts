import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getIdToken } from "@/lib/firebase";

// Development mode flag - set to true for development
const DEV_MODE = true;

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Create the headers object with proper typing
  const headers: Record<string, string> = {};
  
  // Set content type if we have data
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add dev mode header if enabled
  if (DEV_MODE) {
    headers["X-Dev-Mode"] = "true";
  }
  
  // Get Firebase token for production mode
  try {
    const token = await getIdToken();
    if (token) {
      headers["X-Firebase-Uid"] = token;
    }
  } catch (error) {
    console.error("Failed to get Firebase token:", error);
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Include dev-mode headers in GET requests too
    const headers: Record<string, string> = {};
    
    // Add dev mode header if enabled
    if (DEV_MODE) {
      headers["X-Dev-Mode"] = "true";
    }
    
    // Get Firebase token for production mode
    try {
      const token = await getIdToken();
      if (token) {
        headers["X-Firebase-Uid"] = token;
      }
    } catch (error) {
      console.error("Failed to get Firebase token:", error);
    }
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
