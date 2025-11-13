import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";

import { hiveApi } from "../api/client";
import type { Anchor, Breadcrumb, Capture, Item, Zone } from "../types";

interface AppStateContextValue {
  zones: Zone[];
  anchors: Anchor[];
  items: Item[];
  captures: Capture[];
  breadcrumb: Breadcrumb | null;
  activeZoneId: number | null;
  activeAnchorId: number | null;
  setActiveZone: (zoneId: number | null) => void;
  setActiveAnchor: (anchorId: number | null) => void;
  refresh: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }): JSX.Element {
  const [zones, setZones] = useState<Zone[]>([]);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<number | null>(null);
  const [activeAnchorId, setActiveAnchorId] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    const [zoneData, anchorData, itemData, captureData, breadcrumbData] = await Promise.all([
      hiveApi.listZones(),
      hiveApi.listAnchors(),
      hiveApi.listItems(),
      hiveApi.listCaptures(),
      hiveApi.getActiveBreadcrumb()
    ]);
    setZones(zoneData);
    setAnchors(anchorData);
    setItems(itemData);
    setCaptures(captureData);
    setBreadcrumb(breadcrumbData);
    setActiveZoneId((prev) => prev ?? (zoneData[0]?.id ?? null));
    setActiveAnchorId((prev) => prev ?? (anchorData[0]?.id ?? null));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setActiveZone = useCallback((zoneId: number | null) => {
    setActiveZoneId(zoneId);
    if (zoneId === null) {
      setActiveAnchorId(null);
    } else {
      const anchor = anchors.find((a) => a.zone_id === zoneId);
      if (anchor) {
        setActiveAnchorId(anchor.id);
      }
    }
  }, [anchors]);

  const setActiveAnchor = useCallback((anchorId: number | null) => {
    setActiveAnchorId(anchorId);
    if (anchorId != null) {
      const anchor = anchors.find((a) => a.id === anchorId);
      if (anchor) {
        setActiveZoneId(anchor.zone_id);
      }
    }
  }, [anchors]);

  const value = useMemo(() => ({
    zones,
    anchors,
    items,
    captures,
    breadcrumb,
    activeZoneId,
    activeAnchorId,
    setActiveZone,
    setActiveAnchor,
    refresh
  }), [
    zones,
    anchors,
    items,
    captures,
    breadcrumb,
    activeZoneId,
    activeAnchorId,
    setActiveZone,
    setActiveAnchor,
    refresh
  ]);

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return ctx;
}
