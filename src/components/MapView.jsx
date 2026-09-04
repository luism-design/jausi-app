import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "../lib/geocode.js";

// Ícono de pin coloreado por tipo de negocio
function pinIcon(color) {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;background:${color};border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

const BOGOTA = { lat: 4.711, lng: -74.0721 };

/**
 * mode:
 *  - "picker": mapa clicable para elegir ubicación, con buscador de dirección
 *  - "display": muestra un solo punto fijo, no interactivo
 *  - "multi": muestra varios pines (para el mapa de resultados), con click -> onSelectPin(id)
 */
export default function MapView({
  mode = "display",
  center,
  value, // { lat, lng } para picker/display
  onChange, // (latlng) => void, para picker
  pins = [], // [{ id, lat, lng, color, title }], para multi
  onSelectPin,
  height = 260,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const pinsLayerRef = useRef(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const startCenter = value?.lat ? [value.lat, value.lng] : center ? [center.lat, center.lng] : [BOGOTA.lat, BOGOTA.lng];
    const map = L.map(containerRef.current, { scrollWheelZoom: mode !== "display" }).setView(startCenter, value ? 15 : 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;

    if (mode === "picker") {
      map.on("click", (e) => {
        placeMarker(e.latlng.lat, e.latlng.lng, "#DC5A2E");
        onChange?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    if (value?.lat != null) {
      placeMarker(value.lat, value.lng, "#DC5A2E");
    }

    if (mode === "multi") {
      pinsLayerRef.current = L.layerGroup().addTo(map);
    }

    setTimeout(() => map.invalidateSize(), 150);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function placeMarker(lat, lng, color) {
    if (!mapRef.current) return;
    if (markerRef.current) mapRef.current.removeLayer(markerRef.current);
    markerRef.current = L.marker([lat, lng], { icon: pinIcon(color) }).addTo(mapRef.current);
  }

  // Actualiza el marcador único cuando cambia `value` desde afuera (ej: resultado de búsqueda)
  useEffect(() => {
    if (!mapRef.current || mode === "multi") return;
    if (value?.lat != null) {
      placeMarker(value.lat, value.lng, "#DC5A2E");
      mapRef.current.setView([value.lat, value.lng], 15);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value?.lat, value?.lng]);

  // Actualiza los pines múltiples
  useEffect(() => {
    if (!mapRef.current || mode !== "multi" || !pinsLayerRef.current) return;
    pinsLayerRef.current.clearLayers();
    const valid = pins.filter((p) => p.lat != null && p.lng != null);
    valid.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: pinIcon(p.color || "#DC5A2E") });
      if (p.title) m.bindTooltip(p.title, { direction: "top" });
      if (onSelectPin) m.on("click", () => onSelectPin(p.id));
      m.addTo(pinsLayerRef.current);
    });
    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng]));
      mapRef.current.fitBounds(bounds.pad(0.2), { maxZoom: 14 });
    }
  }, [pins, mode, onSelectPin]);

  async function runSearch(e) {
    e?.preventDefault();
    setSearching(true);
    const r = await geocodeAddress(search);
    setResults(r);
    setSearching(false);
  }

  function pickResult(r) {
    setResults([]);
    setSearch(r.label);
    placeMarker(r.lat, r.lng, "#DC5A2E");
    mapRef.current.setView([r.lat, r.lng], 16);
    onChange?.({ lat: r.lat, lng: r.lng });
  }

  return (
    <div>
      {mode === "picker" && (
        <form onSubmit={runSearch} style={{ position: "relative", marginBottom: 8 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              className="field-input"
              placeholder="Busca una dirección o barrio en Colombia…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn-secondary" disabled={searching}>
              {searching ? "…" : "Buscar"}
            </button>
          </div>
          {results.length > 0 && (
            <div className="card" style={{ position: "absolute", top: 44, left: 0, right: 0, zIndex: 500, maxHeight: 180, overflowY: "auto" }}>
              {results.map((r, i) => (
                <div
                  key={i}
                  onClick={() => pickResult(r)}
                  style={{ padding: "8px 12px", fontSize: 13, cursor: "pointer", borderBottom: "1px solid var(--color-border)" }}
                >
                  {r.label}
                </div>
              ))}
            </div>
          )}
        </form>
      )}
      <div ref={containerRef} style={{ height, borderRadius: 14, overflow: "hidden", border: "1px solid var(--color-border)" }} />
      {mode === "picker" && (
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 6 }}>
          También puedes hacer clic directo en el mapa para marcar el punto exacto.
        </div>
      )}
    </div>
  );
}
