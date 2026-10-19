import { PUBLIC_API_URL, SERVER_API_URL } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public retryAfter?: number,
  ) {
    super(message);
  }
}

/**
 * Fetch wrapper for the backend. Works in server and client components; in the
 * browser it sends the admin session cookie along.
 */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isServer = typeof window === "undefined";
  const base = isServer ? SERVER_API_URL : PUBLIC_API_URL;

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      cache: "no-store",
      ...init,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...init.headers },
    });
  } catch {
    throw new ApiError(
      0,
      "Can't reach the server. Check your connection and try again.",
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const retry = res.headers.get("retry-after");
    const retryAfter = retry ? Number(retry) : undefined;
    let message: string = body.error ?? res.statusText;
    if (res.status === 429 && retryAfter) {
      const mins = Math.ceil(retryAfter / 60);
      message = `${message} (try again in ${mins} minute${mins === 1 ? "" : "s"})`;
    }
    throw new ApiError(res.status, message, retryAfter);
  }

  return res.json() as Promise<T>;
}

export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });

export const patch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: "PATCH", body: JSON.stringify(body ?? {}) });

export const del = <T>(path: string) => api<T>(path, { method: "DELETE" });

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong.";
}
