import { fmtCOP, tipoColor } from "../lib/utils.js";

export default function PropertyCard({ listing, onOpen }) {
  const color = tipoColor(listing.tipo_negocio);
  const cover = listing.imagenes?.[0];

  return (
    <div
      className="card"
      style={{ overflow: "hidden", cursor: "pointer", display: "flex", flexDirection: "column" }}
      onClick={() => onOpen(listing.id)}
    >
      <div
        style={{
          height: 160,
          background: cover ? `#eee url(${cover}) center/cover` : "var(--color-surface-soft)",
          position: "relative",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: color,
            color: "white",
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 999,
          }}
        >
          {listing.tipo_negocio}
        </span>
      </div>
      <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{listing.titulo}</div>
        <div style={{ fontSize: 12.5, color: "var(--color-muted)" }}>
          {listing.sector ? `${listing.sector}, ` : ""}
          {listing.ciudad}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 800, color }}>
            {fmtCOP(listing.precio)}
            {listing.tipo_negocio === "Arriendo" ? <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)" }}> /mes</span> : null}
          </span>
          {listing.area ? <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{listing.area} m²</span> : null}
        </div>
      </div>
    </div>
  );
}
