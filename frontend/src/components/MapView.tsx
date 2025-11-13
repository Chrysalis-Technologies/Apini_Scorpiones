import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";

import type { Anchor } from "../types";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapViewProps {
  anchors: Anchor[];
  onAnchorSelect?: (anchor: Anchor) => void;
}

export function MapView({ anchors, onAnchorSelect }: MapViewProps): JSX.Element {
  const anchorsWithCoords = anchors.filter(
    (anchor) => typeof anchor.latitude === "number" && typeof anchor.longitude === "number"
  );

  const center = anchorsWithCoords.length
    ? [anchorsWithCoords[0].latitude as number, anchorsWithCoords[0].longitude as number]
    : [42.871, -75.941];

  if (!anchorsWithCoords.length) {
    return (
      <div className="map-placeholder">
        <p>Drop NFC-enabled anchors with coordinates to light up the Hive map.</p>
      </div>
    );
  }

  return (
    <MapContainer center={center as [number, number]} zoom={15} scrollWheelZoom style={{ height: "320px", borderRadius: "1rem" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {anchorsWithCoords.map((anchor) => (
        <Marker
          key={anchor.id}
          position={[anchor.latitude as number, anchor.longitude as number]}
          icon={markerIcon}
          eventHandlers={{
            click: () => onAnchorSelect?.(anchor)
          }}
        >
          <Popup>
            <strong>{anchor.name}</strong>
            <p>{anchor.description}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
