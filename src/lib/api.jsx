const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/+$/, "");
const TOKEN_KEY = "sahu_token";

function buildUrl(path) {
  const cleanPath = String(path || "").trim();
  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${BASE_URL}/api${normalizedPath}`;
}

export function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

export async function api(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    params,
    noAuth = false,
    credentials,
    signal,
    token: explicitToken,
  } = options;

  let url = buildUrl(path);
  if (params && typeof params === "object") {
    const usp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null) usp.append(k, String(v));
    });
    const qs = usp.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }

  const reqHeaders = { "Content-Type": "application/json", ...headers };
  const tokenToUse = explicitToken || getToken();

  if (!noAuth && tokenToUse && !reqHeaders.Authorization) {
    reqHeaders.Authorization = `Bearer ${tokenToUse}`;
  }

  const resp = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    credentials,
    signal,
  });

  const text = await resp.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!resp.ok) {
    if (resp.status === 401) setToken("");
    const detail =
      (data && (data.detail || data.message || data.error)) ||
      `Request failed with status ${resp.status}`;
    const error = new Error(detail);
    error.status = resp.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default api;
