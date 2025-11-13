import type { Anchor, Breadcrumb, Capture, Item, Zone } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY || "change-me";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
      ...(init?.headers || {})
    }
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

class HiveApiClient {
  listZones(): Promise<Zone[]> {
    return request<Zone[]>("/api/zones");
  }

  listAnchors(zoneId?: number): Promise<Anchor[]> {
    const suffix = zoneId ? `?zone_id=${zoneId}` : "";
    return request<Anchor[]>(`/api/anchors${suffix}`);
  }

  listItems(params?: { zoneId?: number; anchorId?: number }): Promise<Item[]> {
    const search = new URLSearchParams();
    if (params?.zoneId) search.set("zone_id", params.zoneId.toString());
    if (params?.anchorId) search.set("anchor_id", params.anchorId.toString());
    const suffix = search.toString() ? `?${search}` : "";
    return request<Item[]>(`/api/items${suffix}`);
  }

  listCaptures(): Promise<Capture[]> {
    return request<Capture[]>("/api/captures");
  }

  getActiveBreadcrumb(): Promise<Breadcrumb | null> {
    return request<Breadcrumb | null>("/api/breadcrumbs/current");
  }

  startBreadcrumb(anchorId: number): Promise<Breadcrumb> {
    return request<Breadcrumb>("/api/breadcrumbs/start", {
      method: "POST",
      body: JSON.stringify({ anchor_id: anchorId })
    });
  }

  stopBreadcrumb(breadcrumbId?: number): Promise<Breadcrumb | null> {
    return request<Breadcrumb | null>("/api/breadcrumbs/stop", {
      method: "POST",
      body: JSON.stringify({ breadcrumb_id: breadcrumbId })
    });
  }

  createCapture(rawText: string, anchorId?: number, zoneId?: number): Promise<Capture> {
    return request<Capture>("/api/captures", {
      method: "POST",
      body: JSON.stringify({ raw_text: rawText, anchor_id: anchorId, zone_id: zoneId })
    });
  }
}

export const hiveApi = new HiveApiClient();
