const BASE_URL = ("http://152.67.26.114:8000").replace(/\/+$/, "");
const TOKEN_KEY = "sahu_token";

function buildUrl(path) {
  const prefix = "/api";
  const cleanPath = String(path || "").trim();
  return `${BASE_URL}${prefix}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
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
    token: explicitToken,    // 👈 support explicit token
    timeout = 5000,
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

  // Choose token: explicit > localStorage
  let tokenToUse = explicitToken;
  if (!tokenToUse) {
    try { tokenToUse = localStorage.getItem(TOKEN_KEY) || ""; } catch {}
  }
  if (!noAuth && tokenToUse && !reqHeaders["Authorization"]) {
    reqHeaders["Authorization"] = `Bearer ${tokenToUse}`;
  }

  let resp;
  try {
    resp = await fetch(url, {
      method,
      headers: reqHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      credentials,
      signal,
    });
  } catch (err) {
    const message =
      err?.message === "Failed to fetch"
        ? "Network error or CORS issue: Failed to reach the server."
        : err?.message || "Network error";
    const error = new Error(message);
    error.cause = err;
    error.isNetworkError = true;
    throw error;
  }

  const text = await resp.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!resp.ok) {
    if (resp.status === 401) {
      try { localStorage.removeItem(TOKEN_KEY); } catch {}
    }
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