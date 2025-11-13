export type ItemType = "task" | "note";
export type ItemStatus = "open" | "done";

export interface Zone {
  id: number;
  name: string;
  slug: string;
  color?: string | null;
  description?: string | null;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface Anchor {
  id: number;
  zone_id: number;
  anchor_id: string;
  name: string;
  description?: string | null;
  location_hint?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
}

export interface Item {
  id: number;
  title: string;
  body?: string | null;
  type: ItemType;
  status: ItemStatus;
  zone_id?: number | null;
  anchor_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface Capture {
  id: number;
  raw_text: string;
  source: string;
  zone_id?: number | null;
  anchor_id?: number | null;
  created_at: string;
}

export interface Breadcrumb {
  id: number;
  anchor_id: number;
  started_at: string;
  last_action_at: string;
  active: boolean;
}
