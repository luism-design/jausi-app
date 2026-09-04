import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { fmtCOP, tipoColor } from "../lib/utils.js";
import MapView from "../components/MapView.jsx";
import PropertyCard from "../components/PropertyCard.jsx";

export default function Detail({ id, navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [comparables, setComparables] = useState([]);

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
      if (l) {
        const { data: comps } = await supabase
          .from("listings")
          .select("*")
          .eq("estado", "Publicado")
          .eq("ciudad", l.ciudad)
          .eq("tipo_inmueble", l.tipo_inmueble)
          .neq("id", l.id)
          .limit(6);
        if (active) setComparables(comps || []);
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
      etapa: "Nuevo",
      origen: "Formulario",
      ciudad: listing.ciudad,
      tipo_inmueble: listing.tipo_inmueble,
      operacion: listing.tipo_negocio === "Venta" ? "Comprar" : "Arrendar",
    });
    setSending(false);
    if (error) setSendError(error.message);
    else setSent(true);
  }

  if (loading) return <div className="container" style={{ padding: 40 }}>Cargando inmueble…</div>;

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
  const avgComparable = comparables.length
    ? Math.round(comparables.reduce((s, c) => s + Number(c.precio || 0), 0) / comparables.length)
    : null;

  return (
    <div className="container" style={{ padding: "24px 24px 60px", display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 28 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <button className="btn-secondary" onClick={() => navigate("home")}>← Volver</button>
          <div style={{ flex: 1 }} />
          <button className="btn-secondary" onClick={toggleFavorite}>{isFavorite ? "♥ Guardado" : "♡ Guardar"}</button>
          <button className="btn-secondary" onClick={() => setShareOpen((v) => !v)}>Compartir</button>
        </div>

        {shareOpen && (
          <div className="card" style={{ padding: 12, marginBottom: 14, fontSize: 13, display: "flex", gap: 8, alignItems: "center" }}>
            <input className="field-input" readOnly value={shareLink} onFocus={(e) => e.target.select()} />
            <button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(shareLink)}>Copiar</button>
          </div>
        )}

        <div style={{ height: 340, borderRadius: 18, background: "var(--color-surface-soft)", marginBottom: 20, overflow: "hidden" }}>
          {listing.imagenes?.[0] ? (
            <img src={listing.imagenes[0]} alt={listing.titulo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
              Sin fotos todavía
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: color, color: "white", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>
            {listing.tipo_negocio} · {listing.tipo_inmueble}
          </span>
          {listing.destacado && <span style={{ background: "#faeeda", color: "#854f0b", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>★ Destacado</span>}
          {listing.condicion && listing.condicion !== "Usado" && <span className="chip" style={{ padding: "5px 11px" }}>{listing.condicion}</span>}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "10px 0 4px" }}>{listing.titulo}</h1>
        <div style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 14 }}>
          {listing.sector ? `${listing.sector}, ` : ""}{listing.ciudad}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>
          {listing.precio_consultar ? "Precio a consultar" : (
            <>
              {fmtCOP(listing.precio)}
              {listing.tipo_negocio === "Arriendo" && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}> /mes</span>}
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20, fontSize: 13, color: "var(--color-muted)" }}>
          {listing.area && <span><strong style={{ color: "var(--color-ink)" }}>{listing.area}</strong> m²</span>}
          {listing.estrato && <span>Estrato <strong style={{ color: "var(--color-ink)" }}>{listing.estrato}</strong></span>}
          {listing.piso && <span>Piso <strong style={{ color: "var(--color-ink)" }}>{listing.piso}</strong></span>}
          {listing.anio_construccion && <span>Año <strong style={{ color: "var(--color-ink)" }}>{listing.anio_construccion}</strong></span>}
          {listing.administracion ? <span>Admin. <strong style={{ color: "var(--color-ink)" }}>{fmtCOP(listing.administracion)}</strong></span> : null}
        </div>

        {listing.descripcion && <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{listing.descripcion}</p>}

        {(listing.caracteristicas_internas?.length > 0 || listing.caracteristicas_externas?.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {[...(listing.caracteristicas_internas || []), ...(listing.caracteristicas_externas || [])].map((f) => <span key={f} className="chip">{f}</span>)}
          </div>
        )}

        {(listing.video_url || listing.tour_virtual_url) && (
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {listing.video_url && <a href={listing.video_url} target="_blank" rel="noreferrer" className="btn-secondary">▶ Ver video</a>}
            {listing.tour_virtual_url && <a href={listing.tour_virtual_url} target="_blank" rel="noreferrer" className="btn-secondary">360° Tour virtual</a>}
          </div>
        )}

        {listing.descripcion_zona && (
          <div style={{ marginBottom: 20 }}>
            <div className="field-label">La zona</div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>{listing.descripcion_zona}</p>
          </div>
        )}

        {listing.publico_objetivo?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
            {listing.publico_objetivo.map((p) => <span key={p} className="chip" style={{ background: "var(--color-surface-soft)" }}>{p}</span>)}
          </div>
        )}

        {listing.lat != null && listing.lng != null ? (
          <div style={{ marginBottom: 30 }}>
            <div className="field-label">Ubicación</div>
            <MapView mode="display" value={{ lat: listing.lat, lng: listing.lng }} height={220} />
          </div>
        ) : (
          <div className="card" style={{ padding: 16, marginBottom: 30, color: "var(--color-muted)", fontSize: 13 }}>
            Este inmueble todavía no tiene una ubicación marcada en el mapa.
          </div>
        )}

        {comparables.length > 0 && (
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Comparativo con inmuebles similares en {listing.sector || listing.ciudad}
            </div>
            {avgComparable && (
              <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 14 }}>
                Precio promedio de {comparables.length} inmueble{comparables.length === 1 ? "" : "s"} similar{comparables.length === 1 ? "" : "es"}: <strong style={{ color: "var(--color-ink)" }}>{fmtCOP(avgComparable)}</strong>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {comparables.map((c) => (
                <PropertyCard key={c.id} listing={c} onOpen={(cid) => navigate("detail", cid)} />
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        {owner && (
          <div className="card" style={{ padding: 16, marginBottom: 16, cursor: "pointer" }} onClick={() => navigate("advisor", owner.id)}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="avatar-circle" style={{ width: 42, height: 42, fontSize: 15 }}>
                {owner.avatar_url ? <img src={owner.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (owner.nombre || "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{owner.nombre}</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{owner.user_type} · Ver perfil</div>
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
              <button className="btn-primary" disabled={sending} type="submit">{sending ? "Enviando…" : "Enviar mensaje"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
