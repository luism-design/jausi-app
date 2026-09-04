import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import { slugify } from "../lib/utils.js";

export default function Advisor({ id, navigate }) {
  const { user, profile: myProfile, refreshProfile } = useAuth();
  const profileId = id || user?.id;
  const isOwnProfile = !!user && profileId === user.id;

  const [profile, setProfile] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [edit, setEdit] = useState({ nombre: "", bio: "", ciudad: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!profileId) return;
    let active = true;
    setLoading(true);
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("id", profileId).single();
      const { data: l } = await supabase.from("listings").select("*").eq("owner_id", profileId).order("created_at", { ascending: false });
      if (!active) return;
      setProfile(p || null);
      setListings(l || []);
      setEdit({ nombre: p?.nombre || "", bio: p?.bio || "", ciudad: p?.ciudad || "" });
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [profileId]);

  async function saveEdit() {
    setSaving(true);
    await supabase.from("profiles").update(edit).eq("id", user.id);
    setSaving(false);
    setEditOpen(false);
    setProfile((p) => ({ ...p, ...edit }));
    refreshProfile();
  }

  if (!profileId) {
    return <div className="container" style={{ padding: 40 }}>Inicia sesión para ver tu perfil.</div>;
  }
  if (loading) {
    return <div className="container" style={{ padding: 40 }}>Cargando perfil…</div>;
  }
  if (!profile) {
    return <div className="container" style={{ padding: 40 }}>No encontramos este perfil.</div>;
  }

  const slug = slugify(profile.nombre || "asesor");

  return (
    <div className="container" style={{ padding: "28px 24px 60px" }}>
      <div className="card" style={{ padding: 24, marginBottom: 24, display: "flex", gap: 18, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--color-venta)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 22 }}>
          {(profile.nombre || "?").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>{profile.nombre}</div>
          <div style={{ color: "var(--color-muted)", fontSize: 13, marginBottom: 6 }}>
            {profile.user_type} · {profile.ciudad || "Colombia"}
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.5, margin: 0 }}>{profile.bio || "Aún no ha escrito una biografía."}</p>
          <div style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 8 }}>jausi.co/asesor/{slug}</div>
        </div>
        {isOwnProfile && (
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" onClick={() => setEditOpen((v) => !v)}>Editar perfil</button>
            <button className="btn-secondary" onClick={() => navigate("crm")}>Ver CRM</button>
          </div>
        )}
      </div>

      {editOpen && (
        <div className="card" style={{ padding: 20, marginBottom: 24, display: "flex", flexDirection: "column", gap: 12, maxWidth: 480 }}>
          <div>
            <label className="field-label">Nombre</label>
            <input className="field-input" value={edit.nombre} onChange={(e) => setEdit({ ...edit, nombre: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Ciudad</label>
            <input className="field-input" value={edit.ciudad} onChange={(e) => setEdit({ ...edit, ciudad: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Biografía</label>
            <textarea className="field-input" rows={3} value={edit.bio} onChange={(e) => setEdit({ ...edit, bio: e.target.value })} />
          </div>
          <button className="btn-primary" disabled={saving} onClick={saveEdit}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      )}

      <div style={{ fontWeight: 700, marginBottom: 12 }}>
        Inmuebles publicados ({listings.length})
      </div>
      {listings.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>
          {isOwnProfile ? "Aún no has publicado ningún inmueble." : "Este asesor no tiene inmuebles publicados."}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {listings.map((l) => (
            <PropertyCard key={l.id} listing={l} onOpen={(lid) => navigate("detail", lid)} />
          ))}
        </div>
      )}
    </div>
  );
}
