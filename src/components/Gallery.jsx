import { useState } from "react";

export default function Gallery({ images = [], title }) {
  const [showAll, setShowAll] = useState(false);
  if (images.length === 0) {
    return (
      <div style={{ height: 320, borderRadius: 18, background: "var(--color-surface-soft)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
        Sin fotos todavía
      </div>
    );
  }

  if (showAll) {
    return (
      <div style={{ marginBottom: 20 }}>
        <button className="btn-secondary" onClick={() => setShowAll(false)} style={{ marginBottom: 12 }}>✕ Cerrar galería</button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {images.map((src, i) => (
            <img key={i} src={src} alt={`${title} foto ${i + 1}`} style={{ width: "100%", borderRadius: 12, objectFit: "cover" }} />
          ))}
        </div>
      </div>
    );
  }

  const main = images[0];
  const thumbs = images.slice(1, 5);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: thumbs.length > 0 ? "1.4fr 1fr" : "1fr",
        gridTemplateRows: thumbs.length > 2 ? "1fr 1fr" : "1fr",
        gap: 6, height: 320, borderRadius: 18, overflow: "hidden", marginBottom: 20, position: "relative",
      }}
    >
      <div style={{ gridRow: thumbs.length > 2 ? "1 / 3" : "auto" }}>
        <img src={main} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>
      {thumbs.map((src, i) => (
        <div key={i} style={{ position: "relative" }}>
          <img src={src} alt={`${title} foto ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          {i === thumbs.length - 1 && images.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", border: "none", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
            >
              Ver las {images.length} fotos
            </button>
          )}
        </div>
      ))}
      {images.length > 1 && images.length <= 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="btn-secondary"
          style={{ position: "absolute", bottom: 14, right: 14, fontSize: 12 }}
        >
          Ver todas las fotos
        </button>
      )}
    </div>
  );
}
