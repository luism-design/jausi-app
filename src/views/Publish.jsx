import { useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { PROPERTY_TYPES, SPECS_BY_TYPE, tipoColor } from "../lib/utils.js";

const initialForm = {
  tipoInmueble: "Apartamento",
  tipoNegocio: "Venta",
  titulo: "",
  descripcion: "",
  sector: "",
  ciudad: "",
  precio: "",
  area: "",
  estrato: "",
  administracion: "",
  anioConstruccion: "",
  piso: "",
  ubicacionTipo: "Exacta",
  location: null, // { x, y } en porcentaje
  features: {},
};

export default function Publish({ navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: 40 }}>
        Inicia sesión para publicar un inmueble. <button className="btn-secondary" onClick={() => navigate("auth")}>Iniciar sesión</button>
      </div>
    );
  }

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleFeature(f) {
    setForm((prev) => ({ ...prev, features: { ...prev.features, [f]: !prev.features[f] } }));
  }

  function onMapClick(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setForm((f) => ({ ...f, location: { x, y } }));
  }

  function onImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setError(null);

    let imagenes = [];
    if (imageFile) {
      const path = `${user.id}/${Date.now()}-${imageFile.name}`;
      const { error: upErr } = await supabase.storage.from("listing-images").upload(path, imageFile);
      if (upErr) {
        setError("No se pudo subir la imagen: " + upErr.message);
        setSending(false);
        return;
      }
      const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
      imagenes = [pub.publicUrl];
    }

    const { error: insertError } = await supabase.from("listings").insert({
      owner_id: user.id,
      titulo: form.titulo,
      descripcion: form.descripcion,
      tipo_inmueble: form.tipoInmueble,
      tipo_negocio: form.tipoNegocio,
      sector: form.sector,
      ciudad: form.ciudad,
      precio: Number(form.precio) || 0,
      area: form.area ? Number(form.area) : null,
      estrato: form.estrato,
      administracion: form.administracion ? Number(form.administracion) : null,
      anio_construccion: form.anioConstruccion,
      piso: form.piso,
      ubicacion_tipo: form.ubicacionTipo,
      lat: form.location?.y ?? null,
      lng: form.location?.x ?? null,
      features: form.features,
      imagenes,
    });

    setSending(false);
    if (insertError) setError(insertError.message);
    else {
      setSent(true);
      setForm(initialForm);
      setImageFile(null);
      setImagePreview(null);
    }
  }

  const color = tipoColor(form.tipoNegocio);
  const specs = SPECS_BY_TYPE[form.tipoInmueble] || [];

  return (
    <div className="container" style={{ padding: "28px 24px 60px", maxWidth: 720 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 18px" }}>Publicar tu inmueble</h1>

      {sent && (
        <div className="toast-banner" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>¡Tu inmueble fue publicado!</span>
          <button className="btn-secondary" onClick={() => navigate("advisor", user.id)}>Ver mi perfil</button>
        </div>
      )}

      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div>
          <label className="field-label">Tipo de negocio</label>
          <div style={{ display: "flex", gap: 6 }}>
            {["Venta", "Arriendo"].map((t) => (
              <button
                type="button"
                key={t}
                className={`pill-btn ${form.tipoNegocio === t ? "pill-btn-active" : "pill-btn-base"}`}
                onClick={() => setField("tipoNegocio", t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Tipo de inmueble</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {PROPERTY_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                className={`chip ${form.tipoInmueble === t ? "chip-active" : ""}`}
                onClick={() => setField("tipoInmueble", t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Título del anuncio</label>
          <input required className="field-input" value={form.titulo} onChange={(e) => setField("titulo", e.target.value)} placeholder="Ej: Apartamento en Chapinero Alto" />
        </div>

        <div>
          <label className="field-label">Descripción</label>
          <textarea className="field-input" rows={3} value={form.descripcion} onChange={(e) => setField("descripcion", e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label className="field-label">Sector</label>
            <input className="field-input" value={form.sector} onChange={(e) => setField("sector", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Ciudad</label>
            <input className="field-input" value={form.ciudad} onChange={(e) => setField("ciudad", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Precio (COP)</label>
            <input required type="number" className="field-input" value={form.precio} onChange={(e) => setField("precio", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Área (m²)</label>
            <input type="number" className="field-input" value={form.area} onChange={(e) => setField("area", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Estrato</label>
            <input className="field-input" value={form.estrato} onChange={(e) => setField("estrato", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Administración</label>
            <input type="number" className="field-input" value={form.administracion} onChange={(e) => setField("administracion", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Año de construcción</label>
            <input className="field-input" value={form.anioConstruccion} onChange={(e) => setField("anioConstruccion", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Piso</label>
            <input className="field-input" value={form.piso} onChange={(e) => setField("piso", e.target.value)} />
          </div>
        </div>

        <div>
          <label className="field-label">Características</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {specs.map((f) => (
              <button
                type="button"
                key={f}
                className={`chip ${form.features[f] ? "chip-active" : ""}`}
                onClick={() => toggleFeature(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="field-label">Foto principal</label>
          <input type="file" accept="image/*" onChange={onImageChange} />
          {imagePreview && <img src={imagePreview} alt="preview" style={{ marginTop: 10, height: 140, borderRadius: 10, objectFit: "cover" }} />}
        </div>

        <div>
          <label className="field-label">Ubicación (haz clic para marcar el punto aproximado)</label>
          <div
            onClick={onMapClick}
            style={{ position: "relative", height: 180, borderRadius: 14, background: "var(--color-surface-soft)", cursor: "crosshair", overflow: "hidden" }}
          >
            {form.location && (
              <div
                style={{
                  position: "absolute",
                  top: `${form.location.y}%`,
                  left: `${form.location.x}%`,
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

        {error && <div style={{ color: "#b3401f", fontSize: 13 }}>{error}</div>}

        <button className="btn-primary" disabled={sending} type="submit" style={{ alignSelf: "flex-start" }}>
          {sending ? "Publicando…" : "Publicar inmueble"}
        </button>
      </form>
    </div>
  );
}
