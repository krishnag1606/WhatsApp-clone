// Central REST client for the Flux backend. Attaches the Flux session JWT
// (from Phase 1's POST /api/auth/google) to every authenticated call.

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";

const TOKEN_KEY = "flux_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void =>
  localStorage.setItem(TOKEN_KEY, token);
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY);

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Thrown for non-2xx responses so callers can branch on `status` (e.g. 401).
export class ApiError extends Error {
  status: number;
  body: any;
  constructor(status: number, body: any) {
    super(typeof body?.error === "string" ? body.error : `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

const parse = async (res: Response) => {
  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no/invalid JSON body
  }
  if (!res.ok) throw new ApiError(res.status, body);
  return body;
};

export const apiGet = async <T = any>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { ...authHeaders() },
  });
  return parse(res);
};

export const apiPost = async <T = any>(path: string, body?: any): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parse(res);
};

export const apiPut = async <T = any>(path: string, body?: any): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return parse(res);
};

export const apiDelete = async <T = any>(path: string): Promise<T> => {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return parse(res);
};
