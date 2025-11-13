import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { hiveApi } from "../api/client";
import { MapView } from "../components/MapView";
import { useAppState } from "../context/AppState";

export function CommandCenter(): JSX.Element {
  const { anchors, items, captures, refresh, setActiveAnchor } = useAppState();
  const [captureText, setCaptureText] = useState("");
  const navigate = useNavigate();

  const inbox = items.filter((item) => item.status === "open").slice(0, 5);

  const handleCapture = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!captureText.trim()) {
      return;
    }
    await hiveApi.createCapture(captureText.trim());
    setCaptureText("");
    await refresh();
  };

  return (
    <section className="command-center">
      <div className="card">
        <header>
          <h2>Quick Capture</h2>
          <p>Drop loose thoughts here. Re-index later inside your zones.</p>
        </header>
        <form onSubmit={handleCapture} className="capture-form">
          <textarea
            placeholder="What's pulling your attention?"
            value={captureText}
            onChange={(event) => setCaptureText(event.target.value)}
            rows={3}
          />
          <div className="actions">
            <button type="submit">Save capture</button>
          </div>
        </form>
      </div>

      <div className="grid">
        <div className="card">
          <header>
            <h3>Inbox Highlights</h3>
            <p>Five tasks to route into anchors.</p>
          </header>
          <ul>
            {inbox.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                {item.body && <p>{item.body}</p>}
              </li>
            ))}
            {!inbox.length && <p>All clear. Capture something new.</p>}
          </ul>
        </div>

        <div className="card">
          <header>
            <h3>Latest Captures</h3>
            <p>Context from the last 24 hours.</p>
          </header>
          <ul>
            {captures.slice(0, 5).map((capture) => (
              <li key={capture.id}>
                <span>{new Date(capture.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                <p>{capture.raw_text}</p>
              </li>
            ))}
            {!captures.length && <p>Capture queue is empty.</p>}
          </ul>
        </div>
      </div>

      <div className="card">
        <header>
          <h3>Hive Map</h3>
          <p>Physical anchors around you.</p>
        </header>
        <MapView
          anchors={anchors}
          onAnchorSelect={(anchor) => {
            setActiveAnchor(anchor.id);
            navigate(`/anchors/${anchor.anchor_id}`);
          }}
        />
      </div>
    </section>
  );
}
