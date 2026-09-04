import { Ruler, BedDouble, Car, Bath, Warehouse, Store, LandPlot } from "lucide-react";
import { fmtCOP, tipoColor, ICONOS_POR_TIPO } from "../lib/utils.js";

const ICON_MAP = { Ruler, BedDouble, Car, Bath, Warehouse, Store, LandPlot };

export default function PropertyCard({ listing, onOpen, isFavorite, onToggleFavorite }) {
  const color = tipoColor(listing.tipo_negocio);
  const cover = listing.imagenes?.[0];
  const specs = (ICONOS_POR_TIPO[listing.tipo_inmueble] || ICONOS_POR_TIPO.Apartamento).filter(
    (s) => listing[s.key] !== undefined && listing[s.key] !== null && listing[s.key] !== ""
  );

  return (
    <div
      className="property-card"
      style={{ borderRadius: 18, border: "1px solid var(--color-border)", background: "white", overflow: "hidden", cursor: "pointer" }}
      onClick={() => onOpen(listing.id)}
    >
      <div style={{ height: 170, background: cover ? `#eee url(${cover}) center/cover` : "var(--color-surface-soft)", position: "relative" }}>
        <span style={{ position: "absolute", top: 10, left: 10, background: color, color: "white", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>
          {listing.tipo_negocio}
        </span>
        {listing.destacado && (
          <span style={{ position: "absolute", top: 10, right: onToggleFavorite ? 48 : 10, background: "#faeeda", color: "#854f0b", fontSize: 10.5, fontWeight: 700, padding: "5px 9px", borderRadius: 999 }}>★</span>
        )}
        {onToggleFavorite && (
          <button
            className="heart-btn"
            style={{ position: "absolute", top: 8, right: 8 }}
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(listing.id); }}
          >
            {isFavorite ? "♥" : "♡"}
          </button>
        )}
      </div>

      {specs.length > 0 && (
        <div style={{ display: "flex", justifyContent: "space-around", padding: "12px 8px", borderBottom: "1px solid var(--color-border)" }}>
          {specs.map((s) => {
            const Icon = ICON_MAP[s.icon];
            return (
              <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <Icon size={17} color="var(--color-muted)" />
                <span style={{ fontSize: 10.5, fontWeight: 600, textAlign: "center" }}>{listing[s.key]}{s.suffix}</span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ fontSize: 10.5, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 3 }}>{listing.tipo_inmueble}</div>
        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{listing.titulo}</div>
        {listing.descripcion && (
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.4 }}>
            {listing.descripcion}
          </div>
        )}
        <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 8 }}>{listing.sector ? `${listing.sector}, ` : ""}{listing.ciudad}</div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            {listing.precio_consultar ? (
              <span style={{ fontSize: 14, fontWeight: 700 }}>Precio a consultar</span>
            ) : (
              <>
                <span style={{ fontSize: 17, fontWeight: 800 }}>{fmtCOP(listing.precio)}</span>
                {listing.tipo_negocio === "Arriendo" && <span style={{ fontSize: 11, fontWeight: 600, color: "var(--color-muted)" }}> /mes</span>}
              </>
            )}
          </div>
          <button
            style={{ background: "var(--color-surface-soft)", border: "none", borderRadius: 10, padding: "8px 14px", fontSize: 11.5, fontWeight: 700 }}
            onClick={(e) => { e.stopPropagation(); onOpen(listing.id); }}
          >
            Detalle
          </button>
        </div>
      </div>
    </div>
  );
}
