import { useEffect, useState } from "react";
import { Ruler, BedDouble, Car, Bath, Warehouse, Store, LandPlot, Play } from "lucide-react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { fmtCOP, tipoColor, ICONOS_POR_TIPO } from "../lib/utils.js";
import MapView from "../components/MapView.jsx";
import PropertyCard from "../components/PropertyCard.jsx";

const ICON_MAP = { Ruler, BedDouble, Car, Bath, Warehouse, Store, LandPlot };

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function Gallery({ imagenes, titulo }) {
  const [verTodas, setVerTodas] = useState(false);
  const fotos = imagenes?.length ? imagenes : [];

  if (fotos.length === 0) {
    return (
      <div style={{ height: 300, borderRadius: 18, background: "var(--color-surface-soft)", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-muted)" }}>
        Sin fotos todavía
      </div>
    );
  }

  if (verTodas) {
    return (
      <div style={{ marginBottom: 20 }}>
        <button className="btn-secondary" onClick={() => setVerTodas(false)} style={{ marginBottom: 12 }}>← Ver menos</button>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
          {fotos.map((url, i) => (
            <img key={i} src={url} alt={`${titulo} foto ${i + 1}`} style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 12 }} />
          ))}
        </div>
      </div>
    );
  }

  const principal = fotos[0];
  const miniaturas = fotos.slice(1, 5);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: miniaturas.length ? "1.4fr 1fr" : "1fr", gridTemplateRows: "1fr 1fr", gap: 6, height: 320, borderRadius: 18, overflow: "hidden" }}>
        <img src={principal} alt={titulo} style={{ gridRow: miniaturas.length ? "1 / 3" : "auto", width: "100%", height: "100%", objectFit: "cover" }} />
        {miniaturas.map((url, i) => (
          <div key={i} style={{ position: "relative" }}>
            <img src={url} alt={`${titulo} foto ${i + 2}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {i === 3 && fotos.length > 5 && (
              <div
                onClick={() => setVerTodas(true)}
                style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                +{fotos.length - 5} fotos
              </div>
            )}
          </div>
        ))}
      </div>
      {fotos.length > 1 && (
        <button className="btn-secondary" onClick={() => setVerTodas(true)} style={{ marginTop: 10 }}>
          Ver las {fotos.length} fotos
        </button>
      )}
    </div>
  );
}

function VideoBlock({ videoUrl, tourUrl }) {
  const [playing, setPlaying] = useState(false);
  const ytId = getYouTubeId(videoUrl);

  if (!videoUrl && !tourUrl) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      {videoUrl && (
        <>
          <div className="field-label">Video del inmueble</div>
          {!ytId ? (
            <a href={videoUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "inline-block" }}>▶ Ver video</a>
          ) : !playing ? (
            <div
              onClick={() => setPlaying(true)}
              style={{ position: "relative", height: 240, borderRadius: 16, overflow: "hidden", cursor: "pointer", background: "#111" }}
            >
              <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 60, height: 60, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={24} color="var(--color-venta)" fill="var(--color-venta)" />
                </div>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 16, overflow: "hidden" }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                title="Video del inmueble"
                allow="autoplay; encrypted-media"
                allowFullScreen
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
              />
            </div>
          )}
        </>
      )}
      {tourUrl && (
        <a href={tourUrl} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "inline-block", marginTop: videoUrl ? 10 : 0 }}>
          360° Tour virtual
        </a>
      )}
    </div>
  );
}

function SpecGrid({ listing }) {
  const specs = (ICONOS_POR_TIPO[listing.tipo_inmueble] || ICONOS_POR_TIPO.Apartamento).filter(
    (s) => listing[s.key] !== undefined && listing[s.key] !== null && listing[s.key] !== ""
  );
  const extra = [];
  if (listing.estrato) extra.push({ key: "estrato", icon: "Store", label: "Estrato", value: listing.estrato });
  if (listing.anio_construccion) extra.push({ key: "anio_construccion", icon: "Warehouse", label: "Año construcción", value: listing.anio_construccion });
  if (listing.administracion) extra.push({ key: "administracion", icon: "Ruler", label: "Administración", value: fmtCOP(listing.administracion) });

  if (specs.length === 0 && extra.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      <div className="field-label">Detalles del inmueble</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))", gap: 10 }}>
        {specs.map((s) => {
          const Icon = ICON_MAP[s.icon];
          return (
            <div key={s.key} className="card" style={{ padding: "14px 8px", textAlign: "center" }}>
              <Icon size={20} color="var(--color-venta)" style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 800, fontSize: 14 }}>{listing[s.key]}{s.key === "banos" && listing.bano_medio ? "½" : ""}</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{s.label}</div>
            </div>
          );
        })}
        {extra.map((s) => {
          const Icon = ICON_MAP[s.icon];
          return (
            <div key={s.key} className="card" style={{ padding: "14px 8px", textAlign: "center" }}>
              <Icon size={20} color="var(--color-venta)" style={{ marginBottom: 6 }} />
              <div style={{ fontWeight: 800, fontSize: 14 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)" }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Detail({ id, navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [listing, setListing] = useState(null);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [comparables, setComparables] = useState([]);

  const [form, setForm] = useState({ nombre: "", telefono: "", email: "" });
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
        const { data: fav } = await supabase.from("favorites").select("*").eq("user_id", user.id).eq("listing_id", l.id).maybeSingle();
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
    return () => { active = false; };
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

  const ContactForm = () => (
    <div className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ fontWeight: 700, marginBottom: 2 }}>Agenda tu visita</div>
      <div style={{ fontSize: 12.5, color: "var(--color-muted)", marginBottom: 14 }}>Solo necesitamos tus datos básicos, te contactamos enseguida.</div>
      {sent ? (
        <div className="toast-banner">¡Listo! Tu mensaje fue enviado. Te contactarán pronto.</div>
      ) : (
        <form onSubmit={submitLead} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input required className="field-input" placeholder="Nombre completo" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          <input required className="field-input" placeholder="Teléfono (WhatsApp)" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          <input required type="email" className="field-input" placeholder="Correo" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          {sendError && <div style={{ color: "#b3401f", fontSize: 13 }}>{sendError}</div>}
          <button className="btn-primary" disabled={sending} type="submit">{sending ? "Enviando…" : "Quiero agendar una visita"}</button>
        </form>
      )}
    </div>
  );

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

        <Gallery imagenes={listing.imagenes} titulo={listing.titulo} />

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ background: color, color: "white", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>
            {listing.tipo_negocio} · {listing.tipo_inmueble}
          </span>
          {listing.destacado && <span style={{ background: "#faeeda", color: "#854f0b", fontSize: 11, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>★ Destacado</span>}
          {listing.condicion && listing.condicion !== "Usado" && <span className="chip" style={{ padding: "5px 11px" }}>{listing.condicion}</span>}
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 26, margin: "10px 0 4px", lineHeight: 1.25 }}>{listing.titulo}</h1>
        <div style={{ color: "var(--color-muted)", fontSize: 14, marginBottom: 14 }}>
          {listing.sector ? `${listing.sector}, ` : ""}{listing.ciudad}
        </div>
        <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>
          {listing.precio_consultar ? "Precio a consultar" : (
            <>
              {fmtCOP(listing.precio)}
              {listing.tipo_negocio === "Arriendo" && <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-muted)" }}> /mes</span>}
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 14, marginBottom: 20, padding: "12px 0", borderTop: "1px solid var(--color-border)", borderBottom: "1px solid var(--color-border)" }}>
          {["✓ Verificado", "⚡ Respuesta rápida", "★ Asesor certificado"].map((t) => (
            <span key={t} style={{ fontSize: 12, color: "var(--color-muted)", fontWeight: 600 }}>{t}</span>
          ))}
        </div>

        <VideoBlock videoUrl={listing.video_url} tourUrl={listing.tour_virtual_url} />

        {listing.descripcion && (
          <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 20, whiteSpace: "pre-wrap" }}>{listing.descripcion}</p>
        )}

        <SpecGrid listing={listing} />

        {(listing.caracteristicas_internas?.length > 0 || listing.caracteristicas_externas?.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
            {[...(listing.caracteristicas_internas || []), ...(listing.caracteristicas_externas || [])].map((f) => <span key={f} className="chip">{f}</span>)}
          </div>
        )}

        {listing.descripcion_zona && (
          <div style={{ marginBottom: 20 }}>
            <div className="field-label">La zona</div>
            <p style={{ fontSize: 14, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{listing.descripcion_zona}</p>
          </div>
        )}

        {listing.publico_objetivo?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 26 }}>
            {listing.publico_objetivo.map((p) => <span key={p} className="chip" style={{ background: "var(--color-surface-soft)" }}>{p}</span>)}
          </div>
        )}

        <div className="hide-desktop">
          <ContactForm />
          {listing.lat != null && listing.lng != null && (
            <div style={{ marginBottom: 30 }}>
              <div className="field-label">Ubicación</div>
              <MapView mode="display" value={{ lat: listing.lat, lng: listing.lng }} height={200} />
            </div>
          )}
        </div>

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

      <div className="hide-mobile">
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

        <ContactForm />

        {listing.lat != null && listing.lng != null ? (
          <div style={{ marginBottom: 30 }}>
            <div className="field-label">Ubicación</div>
            <MapView mode="display" value={{ lat: listing.lat, lng: listing.lng }} height={200} />
          </div>
        ) : (
          <div className="card" style={{ padding: 16, marginBottom: 30, color: "var(--color-muted)", fontSize: 13 }}>
            Este inmueble todavía no tiene una ubicación marcada en el mapa.
          </div>
        )}
      </div>
    </div>
  );
}
