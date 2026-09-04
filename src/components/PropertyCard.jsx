import { fmtCOP, tipoColor } from "../lib/utils.js";

export default function PropertyCard({ listing, onOpen, isFavorite, onToggleFavorite }) {
  const color = tipoColor(listing.tipo_negocio);
  const cover = listing.imagenes?.[0];

  return (
    <div className="property-card" style={{ cursor: "pointer" }} onClick={() => onOpen(listing.id)}>
      <div
        style={{
          height: 190,
          borderRadius: 16,
          background: cover ? `#eee url(${cover}) center/cover` : "var(--color-surface-soft)",
          position: "relative",
          marginBottom: 10,
        }}
      >
        <span style={{ position: "absolute", top: 10, left: 10, background: color, color: "white", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>
          {listing.tipo_negocio}
        </span>
        {onToggleFavorite && (
          <button
            className="heart-btn"
            style={{ position: "absolute", top: 8, right: 8 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(listing.id);
            }}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.titulo}</div>
        </div>
        <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
          {listing.sector ? `${listing.sector}, ` : ""}{listing.ciudad}
        </div>
        <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>
          {fmtCOP(listing.precio)}
          {listing.tipo_negocio === "Arriendo" && <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-muted)" }}> /mes</span>}
          {listing.area ? <span style={{ fontSize: 12, fontWeight: 500, color: "var(--color-muted)" }}> · {listing.area} m²</span> : null}
        </div>
      </div>
    </div>
  );
}
