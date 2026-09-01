export const AUTH_EXPIRED_EVENT = "auth:expired";

export function handleUnauthorized(redirectPath = "/login") {
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  if (typeof window !== "undefined") {
    const currentPath = window.location.pathname + window.location.search;

    window.dispatchEvent(
      new CustomEvent(AUTH_EXPIRED_EVENT, {
        detail: { from: currentPath },
      }),
    );

    if (window.location.pathname !== redirectPath) {
      window.location.assign(redirectPath);
    }
  }
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const token = localStorage.getItem("token");

  if (!token) {
    handleUnauthorized();
    return new Response(
      JSON.stringify({ error: "Sesión no iniciada o token no encontrado." }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    handleUnauthorized();
  }

  return response;
}
