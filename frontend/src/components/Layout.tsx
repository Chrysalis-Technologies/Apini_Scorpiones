import { Outlet, useNavigate } from "react-router-dom";

import { useAppState } from "../context/AppState";

export function Layout(): JSX.Element {
  const { zones, breadcrumb, anchors, activeZoneId, setActiveZone, setActiveAnchor } = useAppState();
  const navigate = useNavigate();

  const activeBreadcrumbAnchor = breadcrumb
    ? anchors.find((anchor) => anchor.id === breadcrumb.anchor_id)
    : undefined;

  return (
    <div className="app-layout">
      <header className="app-header">
        <div>
          <h1>Hive Dashboard</h1>
          <p>Spatial memory for modern focus.</p>
        </div>
        <nav className="zone-nav">
          {zones.map((zone) => (
            <button
              key={zone.id}
              className={activeZoneId === zone.id ? "active" : "secondary"}
              style={{ borderColor: zone.color ?? undefined }}
              onClick={() => {
                setActiveZone(zone.id);
                navigate(`/zones/${zone.id}`);
              }}
            >
              {zone.name}
            </button>
          ))}
        </nav>
        {activeBreadcrumbAnchor && (
          <div className="breadcrumb-pill">
            <span>Breadcrumb</span>
            <strong>{activeBreadcrumbAnchor.name}</strong>
            <button
              className="secondary"
              onClick={() => {
                setActiveAnchor(activeBreadcrumbAnchor.id);
                navigate(`/anchors/${activeBreadcrumbAnchor.anchor_id}`);
              }}
            >
              Resume
            </button>
          </div>
        )}
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
