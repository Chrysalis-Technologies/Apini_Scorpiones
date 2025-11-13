import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { useAppState } from "../context/AppState";

export function ZonePage(): JSX.Element {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const { zones, anchors, items, setActiveAnchor } = useAppState();

  const zone = useMemo(() => {
    if (!zoneId) return undefined;
    const numeric = Number(zoneId);
    return zones.find((candidate) => candidate.id === numeric || candidate.slug === zoneId);
  }, [zoneId, zones]);

  const zoneAnchors = useMemo(() => {
    if (!zone) return [];
    return anchors.filter((anchor) => anchor.zone_id === zone.id);
  }, [anchors, zone]);

  const zoneItems = useMemo(() => {
    if (!zone) return [];
    return items.filter((item) => item.zone_id === zone.id && item.status === "open");
  }, [items, zone]);

  if (!zone) {
    return <p>Zone not found.</p>;
  }

  return (
    <section>
      <div className="card">
        <header>
          <h2 style={{ color: zone.color || "#f1f5f9" }}>{zone.name}</h2>
          <p>{zone.description || "Describe how this identity should feel."}</p>
        </header>
        <div className="grid">
          <div>
            <h4>Active Anchors</h4>
            <ul>
              {zoneAnchors.map((anchor) => (
                <li key={anchor.id}>
                  <strong>{anchor.name}</strong>
                  <p>{anchor.description}</p>
                  <button
                    className="secondary"
                    onClick={() => {
                      setActiveAnchor(anchor.id);
                      navigate(`/anchors/${anchor.anchor_id}`);
                    }}
                  >
                    Open anchor
                  </button>
                </li>
              ))}
              {!zoneAnchors.length && <p>No anchors yet. NFC tags are waiting.</p>}
            </ul>
          </div>
          <div>
            <h4>Next Actions</h4>
            <ul>
              {zoneItems.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong>
                  {item.body && <p>{item.body}</p>}
                </li>
              ))}
              {!zoneItems.length && <p>Queue is clear. Capture something for this zone.</p>}
            </ul>
          </div>
        </div>
      </div>
      <Link to="/">← Back to Command Center</Link>
    </section>
  );
}
