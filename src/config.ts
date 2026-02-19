const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "";

export function getApiUrl(path: string): string {
  if (!backendUrl) return path;
  const base = backendUrl.replace(/\/$/, "");
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}

export function getWsUrl(path: string, params?: Record<string, string>): string {
  if (!backendUrl) {
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const url = `${protocol}://${window.location.host}${path}`;
    if (!params) return url;
    const search = new URLSearchParams(params).toString();
    return search ? `${url}?${search}` : url;
  }
  const wsBase = backendUrl.replace(/^http/, "ws");
  const base = wsBase.replace(/\/$/, "");
  const url = path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
  if (!params) return url;
  const search = new URLSearchParams(params).toString();
  return search ? `${url}?${search}` : url;
}
