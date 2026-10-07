import { mockRequest } from "./mock/routes";

function collectHeaders(source?: HeadersInit): Record<string, string> {
  const collected: Record<string, string> = {};
  new Headers(source ?? undefined).forEach((value, key) => {
    collected[key] = value;
  });
  return collected;
}

function parseBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== "string" || body.length === 0) return undefined;
  try {
    return JSON.parse(body) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * The transport every page and modal talks to. It resolves account ids to names,
 * enforces unique names and in-use guards, and returns the same payload shapes as
 * the original server — except the ledger lives in this browser, not on a server.
 */
export function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  return mockRequest<T>(url, {
    method: init?.method,
    body: parseBody(init?.body),
    headers: collectHeaders(init?.headers),
  });
}

export function apiPost<T>(url: string, body: unknown, init?: RequestInit): Promise<T> {
  return mockRequest<T>(url, {
    method: "POST",
    body,
    headers: collectHeaders(init?.headers),
  });
}

export function apiPatch<T>(url: string, body: unknown): Promise<T> {
  return mockRequest<T>(url, { method: "PATCH", body });
}

export function apiDelete<T>(url: string): Promise<T> {
  return mockRequest<T>(url, { method: "DELETE" });
}
