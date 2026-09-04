import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { fmtCOP, tipoColor, slugify } from "../lib/utils.js";

export default function Detail({ id, navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const [form, setForm] = useState({ nombre: "", telefono: "", email: "", mensaje: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSent(false);
    (async () => {
      const { data: l } = await supabase.from("listings").select("*").eq("id", id).single();
      if (!active) return;
      setListing(l || null);
      if (l?.owner_id) {
        const { data: p } = await supabase.from("profiles").select("*").eq("id", l.owner_id).single();
        if (active) setOwner(p || null);
      }
      if (l && user) {
        const { data: fav } = await supabase
          .from("favorites")
          .select("*")
          .eq("user_id", user.id)
          .eq("listing_id", l.id)
          .maybeSingle();
        if (active) setIsFavorite(!!fav);
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id, user]);

  async function toggleFavorite() {
    if (!isLoggedIn) return navigate("auth");
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", listing.id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, listing_id: listing.id });
      setIsFavorite(true);
    }
  }

  async function submitLead(e) {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    const { error } = await supabase.from("leads").insert({
      listing_id: listing.id,
      advisor_id: listing.owner_id,
      nombre: form.nombre,
      telefono: form.telefono,
      email: form.email,
      mensaje: form.mensaje,
    });
    setSending(false);
    if (error) setSendError(error.message);
    else setSent(true);
  }

  if (loading) {
    return <div className="container" style={{ padding: 40 }}>Cargando inmueble…</div>;
  }

  if (!listing) {
    return (
      <div className="container" style={{ padding: 40, textAlign: "center" }}>
        <p style={{ fontWeight: 700 }}>No encontramos este inmueble.</p>
        <button className="btn-secondary" onClick={() => navigate("home")}>Volver al inicio</button>
      </div>
    );
  }

  const color = tipoColor(listing.tipo_negocio);
  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/inmueble/${listing.id}` : "";

  return (
    <div className="container" style={{ padding: "24px 24px 60px", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 28 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button className="btn-secondary" onClick={() => navigate("home")}>← Volver</button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={toggleFavorite}>
            {isFavorite ? "★ Guardado" : "☆ Guardar"}
          </button>
          <button className="btn-secondary" onClick={() => setShareOpen((v) => !v)}>Compartir</button>
        </div>

        {shareOpen && (
          <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <input className="field-input" readOnly value={shareLink} onFocus={(e) => e.target.select()} />
            <button
              className="btn-secondary"
              onClick={() => navigator.clipboard?.writeText(shareLink)}
            >
              Copiar
            </button>
          </div>
        )}

        <div style={{ height: 320, borderRadius: 16, background: "var(--color-surface-soft)", marginBottom: 20, overflow: "hidden" }}>
          {listing.imagenes?.[0] ? (
            <img src={listing.imagenes[0]} alt={listing.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
              Sin fotos todavía
            </div>
          )}
        </div>

        <span style={{ background: color, color: "white", fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 999 }}>
          {listing.tipo_negocio} · {listing.tipo_inmueble}
        </span>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "10px 0 4px" }}>{listing.titulo}</h1>
        <div style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 14 }}>
          {listing.sector ? `${listing.sector}, ` : ""}{listing.ciudad}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, color, marginBottom: 20 }}>
          {fmtCOP(listing.precio)}
          {listing.tipo_negocio === "Arriendo" && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}> /mes</span>}
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20, fontSize: 13, color: "var(--color-muted)" }}>
          {listing.area && <span><strong style={{ color: "var(--color-ink)" }}>{listing.area}</strong> m²</span>}
          {listing.estrato && <span>Estrato <strong style={{ color: "var(--color-ink)" }}>{listing.estrato}</strong></span>}
          {listing.piso && <span>Piso <strong style={{ color: "var(--color-ink)" }}>{listing.piso}</strong></span>}
          {listing.anio_construccion && <span>Año <strong style={{ color: "var(--color-ink)" }}>{listing.anio_construccion}</strong></span>}
          {listing.administracion ? <span>Admin. <strong style={{ color: "var(--color-ink)" }}>{fmtCOP(listing.administracion)}</strong></span> : null}
        </div>

        {listing.descripcion && (
          <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--color-ink)", marginBottom: 20 }}>{listing.descripcion}</p>
        )}

        {listing.features && Object.keys(listing.features).some((k) => listing.features[k]) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
            {Object.entries(listing.features).filter(([, v]) => v).map(([f]) => (
              <span key={f} className="chip">{f}</span>
            ))}
          </div>
        )}

        {(listing.lat != null || listing.ubicacion_tipo) && (
          <div>
            <div className="field-label">Ubicación</div>
            <div style={{ position: "relative", height: 200, borderRadius: 14, background: "var(--color-surface-soft)", overflow: "hidden" }}>
              {listing.lat != null && listing.lng != null && (
                <div
                  style={{
                    position: "absolute",
                    top: `${listing.lat}%`,
                    left: `${listing.lng}%`,
                    width: 16,
                    height: 16,
                    background: color,
                    borderRadius: "50% 50% 50% 0",
                    transform: "translate(-50%,-100%) rotate(-45deg)",
                    border: "2px solid white",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Panel lateral: asesor + contacto */}
      <div>
        {owner && (
          <div className="card" style={{ padding: 16, marginBottom: 16, cursor: "pointer" }} onClick={() => navigate("advisor", owner.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: color, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                {(owner.nombre || "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{owner.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{owner.user_type}</div>
              </div>
            </div>
          </div>
        )}

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Contactar por este inmueble</div>
          {sent ? (
            <div className="toast-banner">¡Listo! Tu mensaje fue enviado. Te contactarán pronto.</div>
          ) : (
            <form onSubmit={submitLead} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input required className="field-input" placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              <input required className="field-input" placeholder="Teléfono" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
              <input required type="email" className="field-input" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <textarea className="field-input" rows={3} placeholder="Mensaje (opcional)" value={form.mensaje} onChange={(e) => setForm({ ...form, mensaje: e.target.value })} />
              {sendError && <div style={{ color: "#b3401f", fontSize: 13 }}>{sendError}</div>}
              <button className="btn-primary" disabled={sending} type="submit">
                {sending ? "Enviando…" : "Enviar mensaje"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
