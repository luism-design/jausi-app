import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import { fmtCOP } from "../lib/utils.js";

const ESTADOS_LISTING = ["Publicado", "Pausado", "Vendido", "Arrendado"];

export default function Advisor({ id, navigate }) {
  const { user, refreshProfile } = useAuth();
  const profileId = id || user?.id;
  const isOwnProfile = !!user && profileId === user.id;

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [saving, setSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [uploading, setUploading] = useState(null); // "avatar" | "cover" | null

  async function load() {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", profileId).single();
    const { data: l } = await supabase.from("listings").select("*").eq("owner_id", profileId).order("created_at", { ascending: false });
    setProfile(p || null);
    setListings(l || []);
    setEdit({
      nombre: p?.nombre || "",
      bio: p?.bio || "",
      ciudad: p?.ciudad || "",
      telefono_publico: p?.telefono_publico || "",
      whatsapp: p?.whatsapp || "",
      sitio_web: p?.sitio_web || "",
      instagram: p?.instagram || "",
    });
    setLoading(false);
  }

  useEffect(() => {
    if (profileId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function saveEdit() {
    setSaving(true);
    await supabase.from("profiles").update(edit).eq("id", user.id);
    setSaving(false);
    setEditOpen(false);
    setProfile((p) => ({ ...p, ...edit }));
    refreshProfile();
  }

  async function uploadImage(file, field) {
    setUploading(field);
    const path = `${user.id}/${field}-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true });
    if (!error) {
      const { data: pub } = supabase.storage.from("profile-images").getPublicUrl(path);
      await supabase.from("profiles").update({ [field === "avatar" ? "avatar_url" : "cover_url"]: pub.publicUrl }).eq("id", user.id);
      setProfile((p) => ({ ...p, [field === "avatar" ? "avatar_url" : "cover_url"]: pub.publicUrl }));
      refreshProfile();
    }
    setUploading(null);
  }

  async function updateEstado(listingId, estado) {
    setListings((prev) => prev.map((l) => (l.id === listingId ? { ...l, estado } : l)));
    await supabase.from("listings").update({ estado }).eq("id", listingId);
  }

  async function deleteListing(listingId) {
    if (!window.confirm("¿Eliminar este inmueble? Esta acción no se puede deshacer.")) return;
    setListings((prev) => prev.filter((l) => l.id !== listingId));
    await supabase.from("listings").delete().eq("id", listingId);
  }

  if (!profileId) return <div className="container" style={{ padding: 40 }}>Inicia sesión para ver tu perfil.</div>;
  if (loading || !edit) return <div className="container" style={{ padding: 40 }}>Cargando perfil…</div>;
  if (!profile) return <div className="container" style={{ padding: 40 }}>No encontramos este perfil.</div>;

  const shareLink = typeof window !== "undefined" ? `${window.location.origin}/asesor/${profile.id}` : "";
  const visibleListings = isOwnProfile ? listings : listings.filter((l) => l.estado === "Publicado");

  return (
    <div style={{ paddingBottom: 60 }}>
      {/* Portada */}
      <div style={{ position: "relative", height: 220, background: profile.cover_url ? `#eee url(${profile.cover_url}) center/cover` : "linear-gradient(135deg, var(--color-venta), var(--color-arriendo))" }}>
        {isOwnProfile && (
          <label style={{ position: "absolute", right: 16, bottom: 16, background: "white", borderRadius: 999, padding: "8px 16px", fontSize: 12.5, fontWeight: 700, cursor: "pointer", boxShadow: "var(--shadow-card)" }}>
            {uploading === "cover" ? "Subiendo…" : "Cambiar portada"}
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "cover")} />
          </label>
        )}
      </div>

      <div className="container" style={{ padding: "0 24px" }}>
        {/* Cabecera de perfil */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 18, marginTop: -48, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ position: "relative" }}>
            <div className="avatar-circle" style={{ width: 108, height: 108, fontSize: 34, border: "4px solid white" }}>
              {profile.avatar_url ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (profile.nombre || "?").slice(0, 2).toUpperCase()}
            </div>
            {isOwnProfile && (
              <label style={{ position: "absolute", bottom: 0, right: 0, background: "var(--color-ink)", color: "white", borderRadius: "50%", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, cursor: "pointer" }}>
                ✎
                <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0], "avatar")} />
              </label>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 220, paddingBottom: 4 }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{profile.nombre}</div>
            <div style={{ color: "var(--color-muted)", fontSize: 13.5 }}>{profile.user_type} · {profile.ciudad || "Colombia"}</div>
          </div>

          <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
            <button className="btn-secondary" onClick={() => setShareOpen((v) => !v)}>Compartir perfil</button>
            {isOwnProfile && (
              <>
                <button className="btn-secondary" onClick={() => setEditOpen((v) => !v)}>Editar perfil</button>
                <button className="btn-secondary" onClick={() => navigate("crm")}>Ver CRM</button>
              </>
            )}
          </div>
        </div>

        {shareOpen && (
          <div className="card" style={{ padding: 12, marginBottom: 20, fontSize: 13, display: "flex", gap: 8, alignItems: "center", maxWidth: 480 }}>
            <input className="field-input" readOnly value={shareLink} onFocus={(e) => e.target.select()} />
            <button className="btn-secondary" onClick={() => navigator.clipboard?.writeText(shareLink)}>Copiar</button>
          </div>
        )}

        {profile.bio && !editOpen && <p style={{ fontSize: 14.5, lineHeight: 1.6, maxWidth: 640, marginBottom: 12 }}>{profile.bio}</p>}

        {!editOpen && (profile.telefono_publico || profile.whatsapp || profile.sitio_web || profile.instagram) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24, fontSize: 13 }}>
            {profile.whatsapp && <a className="chip" href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer">WhatsApp</a>}
            {profile.telefono_publico && <span className="chip">{profile.telefono_publico}</span>}
            {profile.sitio_web && <a className="chip" href={profile.sitio_web} target="_blank" rel="noreferrer">Sitio web</a>}
            {profile.instagram && <a className="chip" href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noreferrer">Instagram</a>}
          </div>
        )}

        {editOpen && (
          <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
            <div><label className="field-label">Nombre</label><input className="field-input" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} /></div>
            <div><label className="field-label">Ciudad</label><input className="field-input" value={edit.ciudad} onChange={(e) => setEdit({ ...edit, ciudad: e.target.value })} /></div>
            <div><label className="field-label">Biografía</label><textarea className="field-input" rows={3} value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} /></div>
            <div><label className="field-label">Teléfono público</label><input className="field-input" value={edit.telefono_publico} onChange={(e) => setEdit({ ...edit, telefono_publico: e.target.value })} /></div>
            <div><label className="field-label">WhatsApp (con indicativo, ej: 573001234567)</label><input className="field-input" value={edit.whatsapp} onChange={(e) => setEdit({ ...edit, whatsapp: e.target.value })} /></div>
            <div><label className="field-label">Sitio web</label><input className="field-input" value={edit.sitio_web} onChange={(e) => setEdit({ ...edit, sitio_web: e.target.value })} /></div>
            <div><label className="field-label">Instagram</label><input className="field-input" value={edit.instagram} onChange={(e) => setEdit({ ...edit, instagram: e.target.value })} /></div>
            <button className="btn-primary" disabled={saving} onClick={saveEdit} style={{ alignSelf: "flex-start" }}>{saving ? "Guardando…" : "Guardar cambios"}</button>
          </div>
        )}

        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>
          Inmuebles publicados ({visibleListings.length})
        </div>

        {visibleListings.length === 0 ? (
          <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>
            {isOwnProfile ? "Aún no has publicado ningún inmueble." : "Este perfil no tiene inmuebles publicados."}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {visibleListings.map((l) => (
              <div key={l.id}>
                <PropertyCard listing={l} onOpen={(lid) => navigate("detail", lid)} />
                {isOwnProfile && (
                  <div style={{ display: "flex", gap: 6, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12 }} onClick={() => navigate("edit", l.id)}>Editar</button>
                    <select
                      className="field-input"
                      style={{ padding: "5px 8px", fontSize: 12, width: "auto" }}
                      value={l.estado}
                      onChange={(e) => updateEstado(l.id, e.target.value)}
                    >
                      {ESTADOS_LISTING.map((e) => <option key={e} value={e}>{e}</option>)}
                    </select>
                    <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: 12, color: "#b3401f" }} onClick={() => deleteListing(l.id)}>Eliminar</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
