import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { hiveApi } from "../api/client";
import { useAppState } from "../context/AppState";

export function AnchorPage(): JSX.Element {
  const { anchorId } = useParams();
  const { anchors, items, breadcrumb, refresh } = useAppState();
  const [isStarting, setIsStarting] = useState(false);

  const anchor = anchors.find(
    (candidate) => candidate.anchor_id === anchorId || candidate.id.toString() === anchorId
  );

  const anchorItems = items.filter((item) => item.anchor_id === anchor?.id && item.status === "open");

  if (!anchor) {
    return <p>Anchor not found.</p>;
  }

  const startBreadcrumb = async () => {
    setIsStarting(true);
    try {
      await hiveApi.startBreadcrumb(anchor.id);
      await refresh();
    } finally {
      setIsStarting(false);
    }
  };

  const isActive = breadcrumb?.anchor_id === anchor.id && breadcrumb.active;

  const stopBreadcrumb = async () => {
    setIsStarting(true);
    try {
      await hiveApi.stopBreadcrumb(breadcrumb?.id);
      await refresh();
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <section>
      <div className="card">
        <header>
          <h2>{anchor.name}</h2>
          <p>{anchor.description || "Describe the rituals anchored here."}</p>
        </header>
        <p>
          Location hint: <strong>{anchor.location_hint || "Set a clear physical cue."}</strong>
        </p>
        <div className="actions" style={{ gap: "0.75rem", display: "flex" }}>
          <button onClick={startBreadcrumb} disabled={isStarting}>
            {isActive ? "Breadcrumb active" : "Start breadcrumb"}
          </button>
          {isActive && (
            <button className="secondary" onClick={stopBreadcrumb} disabled={isStarting}>
              Stop breadcrumb
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <header>
          <h3>Anchor Checklist</h3>
          <p>Tasks bound to this anchor.</p>
        </header>
        <ul>
          {anchorItems.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong>
              {item.body && <p>{item.body}</p>}
            </li>
          ))}
          {!anchorItems.length && <p>No tasks routed here yet.</p>}
        </ul>
      </div>

      <Link to={`/zones/${anchor.zone_id}`}>← Back to zone</Link>
    </section>
  );
}
