import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import {
  TIPOS_INMUEBLE, CONDICIONES_INMUEBLE, CAMPOS_POR_TIPO,
  CARACTERISTICAS_INTERNAS, CARACTERISTICAS_EXTERNAS,
} from "../lib/utils.js";
import MapView from "../components/MapView.jsx";

const emptyForm = {
  destacado: false,
  tipoInmueble: "Apartamento",
  tipoNegocio: "Venta",
  condicion: "Usado",
  titulo: "",
  matricula: "",
  matriculaPublica: false,
  referenciaCatastral: "",
  catastralPublica: false,
  departamento: "",
  ciudad: "",
  sector: "",
  descripcion: "",
  precio: "",
  precioConsultar: false,
  administracion: "",
  area: "",
  areaPrivada: "",
  areaTerreno: "",
  habitaciones: "",
  banos: "",
  banoMedio: false,
  parqueaderos: "",
  piso: "",
  estrato: "",
  anioConstruccion: "",
  pisosEdificio: "",
  videoUrl: "",
  tourVirtualUrl: "",
  comision: "Compartida",
  comisionPct: "3",
  financiacion: "",
  aceptaPermuta: false,
  publicoObjetivo: [],
  caracteristicasInternas: [],
  caracteristicasExternas: [],
  mostrarUbicacionExacta: false,
  descripcionZona: "",
  location: null,
  // privados
  direccion: "",
  ownerNombre: "",
  ownerTelefono: "",
  ownerCorreo: "",
  observaciones: "",
  estado: "Publicado",
};

function Label({ children }) {
  return <label className="field-label">{children}</label>;
}
function SectionTitle({ children }) {
  return <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-venta)", fontWeight: 700, margin: "22px 0 10px" }}>{children}</p>;
}
function Toggle({ active, onClick, label, sublabel }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: "100%", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 14px", borderRadius: 12, background: active ? "var(--color-venta-soft)" : "var(--color-surface-soft)",
        border: `1px solid ${active ? "var(--color-venta)" : "transparent"}`, cursor: "pointer",
      }}
    >
      <span style={{ textAlign: "left", fontSize: 13.5, fontWeight: 600, color: active ? "var(--color-venta)" : "var(--color-ink)" }}>{sublabel && active ? sublabel : label}</span>
      <span style={{ width: 36, height: 20, borderRadius: 999, background: active ? "var(--color-venta)" : "var(--color-border)", position: "relative", flexShrink: 0 }}>
        <span style={{ position: "absolute", top: 2, left: active ? 18 : 2, width: 16, height: 16, borderRadius: "50%", background: "white" }} />
      </span>
    </button>
  );
}

export default function Publish({ navigate, id }) {
  const { user, isLoggedIn } = useAuth();
  const editing = !!id;
  const [form, setForm] = useState(emptyForm);
  const [loadingListing, setLoadingListing] = useState(editing);
  const [existingImages, setExistingImages] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [nuevoPublico, setNuevoPublico] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!editing) return;
    let active = true;
    (async () => {
      const { data: l } = await supabase.from("listings").select("*").eq("id", id).single();
      const { data: priv } = await supabase.from("listing_private").select("*").eq("listing_id", id).maybeSingle();
      if (!active) return;
      if (!l || l.owner_id !== user?.id) {
        setNotFound(true);
        setLoadingListing(false);
        return;
      }
      setForm({
        destacado: !!l.destacado,
        tipoInmueble: l.tipo_inmueble,
        tipoNegocio: l.tipo_negocio,
        condicion: l.condicion || "Usado",
        titulo: l.titulo || "",
        matricula: l.matricula || "",
        matriculaPublica: !!l.matricula_publica,
        referenciaCatastral: l.referencia_catastral || "",
        catastralPublica: !!l.catastral_publica,
        departamento: l.departamento || "",
        ciudad: l.ciudad || "",
        sector: l.sector || "",
        descripcion: l.descripcion || "",
        precio: l.precio ?? "",
        precioConsultar: !!l.precio_consultar,
        administracion: l.administracion ?? "",
        area: l.area ?? "",
        areaPrivada: l.area_privada ?? "",
        areaTerreno: l.area_terreno ?? "",
        habitaciones: l.habitaciones ?? "",
        banos: l.banos ?? "",
        banoMedio: !!l.bano_medio,
        parqueaderos: l.parqueaderos ?? "",
        piso: l.piso || "",
        estrato: l.estrato || "",
        anioConstruccion: l.anio_construccion || "",
        pisosEdificio: l.pisos_edificio ?? "",
        videoUrl: l.video_url || "",
        tourVirtualUrl: l.tour_virtual_url || "",
        comision: l.comision || "Compartida",
        comisionPct: l.comision_pct ?? "3",
        financiacion: l.financiacion || "",
        aceptaPermuta: !!l.acepta_permuta,
        publicoObjetivo: l.publico_objetivo || [],
        caracteristicasInternas: l.caracteristicas_internas || [],
        caracteristicasExternas: l.caracteristicas_externas || [],
        mostrarUbicacionExacta: !!l.mostrar_ubicacion_exacta,
        descripcionZona: l.descripcion_zona || "",
        location: l.lat != null ? { lat: l.lat, lng: l.lng } : null,
        direccion: priv?.direccion || "",
        ownerNombre: priv?.owner_nombre || "",
        ownerTelefono: priv?.owner_telefono || "",
        ownerCorreo: priv?.owner_correo || "",
        observaciones: priv?.observaciones || "",
        estado: l.estado,
      });
      setExistingImages(l.imagenes || []);
      setLoadingListing(false);
    })();
    return () => { active = false; };
  }, [editing, id, user]);

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: 40 }}>
        Inicia sesión para publicar un inmueble. <button className="btn-secondary" onClick={() => navigate("auth")}>Iniciar sesión</button>
      </div>
    );
  }
  if (loadingListing) return <div className="container" style={{ padding: 40 }}>Cargando…</div>;
  if (notFound) return <div className="container" style={{ padding: 40 }}>No puedes editar este inmueble.</div>;

  const set = (k, v) => setForm((s) => ({ ...s, [k]: v }));
  const toggleArr = (k, v) => setForm((s) => ({ ...s, [k]: s[k].includes(v) ? s[k].filter((x) => x !== v) : [...s[k], v] }));
  const cfg = CAMPOS_POR_TIPO[form.tipoInmueble] || {};

  function agregarPublico() {
    if (!nuevoPublico.trim()) return;
    set("publicoObjetivo", [...form.publicoObjetivo, nuevoPublico.trim()]);
    setNuevoPublico("");
  }
  function onImageChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const total = existingImages.length + imageFiles.length + files.length;
    const allowed = files.slice(0, Math.max(0, 20 - existingImages.length - imageFiles.length));
    if (total > 20) setError("Máximo 20 fotos por inmueble. Se agregaron las primeras hasta completar el límite.");
    setImageFiles((prev) => [...prev, ...allowed]);
    setImagePreviews((prev) => [...prev, ...allowed.map((f) => URL.createObjectURL(f))]);
  }
  function removeExistingImage(i) {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== i));
  }
  function removeNewImage(i) {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== i));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e) {
    e.preventDefault();
    setSending(true);
    setError(null);

    let imagenes = [...existingImages];
    if (imageFiles.length) {
      for (const file of imageFiles) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("listing-images").upload(path, file);
        if (upErr) {
          setError("No se pudo subir una imagen: " + upErr.message);
          setSending(false);
          return;
        }
        const { data: pub } = supabase.storage.from("listing-images").getPublicUrl(path);
        imagenes.push(pub.publicUrl);
      }
    }
    imagenes = imagenes.slice(0, 20);

    const payload = {
      destacado: form.destacado,
      tipo_inmueble: form.tipoInmueble,
      tipo_negocio: form.tipoNegocio,
      condicion: form.condicion,
      titulo: form.titulo,
      matricula: form.matricula,
      matricula_publica: form.matriculaPublica,
      referencia_catastral: form.referenciaCatastral,
      catastral_publica: form.catastralPublica,
      departamento: form.departamento,
      ciudad: form.ciudad,
      sector: form.sector,
      descripcion: form.descripcion,
      precio: Number(form.precio) || 0,
      precio_consultar: form.precioConsultar,
      administracion: form.administracion ? Number(form.administracion) : null,
      area: form.area ? Number(form.area) : null,
      area_privada: form.areaPrivada ? Number(form.areaPrivada) : null,
      area_terreno: form.areaTerreno ? Number(form.areaTerreno) : null,
      habitaciones: form.habitaciones ? Number(form.habitaciones) : null,
      banos: form.banos ? Number(form.banos) : null,
      bano_medio: form.banoMedio,
      parqueaderos: form.parqueaderos ? Number(form.parqueaderos) : null,
      piso: form.piso,
      estrato: form.estrato,
      anio_construccion: form.anioConstruccion,
      pisos_edificio: form.pisosEdificio ? Number(form.pisosEdificio) : null,
      video_url: form.videoUrl,
      tour_virtual_url: form.tourVirtualUrl,
      comision: form.comision,
      comision_pct: form.comisionPct ? Number(form.comisionPct) : null,
      financiacion: form.financiacion,
      acepta_permuta: form.aceptaPermuta,
      publico_objetivo: form.publicoObjetivo,
      caracteristicas_internas: form.caracteristicasInternas,
      caracteristicas_externas: form.caracteristicasExternas,
      mostrar_ubicacion_exacta: form.mostrarUbicacionExacta,
      descripcion_zona: form.descripcionZona,
      lat: form.location?.lat ?? null,
      lng: form.location?.lng ?? null,
      imagenes,
    };

    let listingId = id;
    let opError;
    if (editing) {
      const { error } = await supabase.from("listings").update(payload).eq("id", id);
      opError = error;
    } else {
      const { data, error } = await supabase.from("listings").insert({ ...payload, owner_id: user.id }).select("id").single();
      opError = error;
      listingId = data?.id;
    }

    if (!opError && listingId) {
      await supabase.from("listing_private").upsert({
        listing_id: listingId,
        owner_id: user.id,
        direccion: form.direccion,
        owner_nombre: form.ownerNombre,
        owner_telefono: form.ownerTelefono,
        owner_correo: form.ownerCorreo,
        observaciones: form.observaciones,
      });
    }

    setSending(false);
    if (opError) setError(opError.message);
    else {
      setSent(true);
      if (!editing) {
        setForm(emptyForm);
        setImageFiles([]);
        setImagePreviews([]);
      }
    }
  }

  return (
    <div className="container" style={{ padding: "28px 24px 60px", maxWidth: 640 }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 18px" }}>
        {editing ? "Editar inmueble" : "Publicar tu inmueble"}
      </h1>

      {sent && (
        <div className="toast-banner" style={{ marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{editing ? "Los cambios se guardaron." : "¡Tu inmueble fue publicado!"}</span>
          <button className="btn-secondary" onClick={() => navigate("advisor", user.id)}>Ver mi perfil</button>
        </div>
      )}

      <form onSubmit={submit}>
        <SectionTitle>Datos generales</SectionTitle>
        <Toggle active={form.destacado} onClick={() => set("destacado", !form.destacado)} label="Destacar este inmueble" sublabel="★ Destacado activo" />

        <Label>Tipo de negocio</Label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["Venta", "Arriendo"].map((t) => (
            <button type="button" key={t} className={`pill-btn ${form.tipoNegocio === t ? "pill-btn-active" : "pill-btn-base"}`} onClick={() => set("tipoNegocio", t)}>{t}</button>
          ))}
        </div>

        <Label>Tipo de inmueble</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {TIPOS_INMUEBLE.map((t) => <button type="button" key={t} className={`chip ${form.tipoInmueble === t ? "chip-active" : ""}`} onClick={() => set("tipoInmueble", t)}>{t}</button>)}
        </div>

        <Label>Condición</Label>
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {CONDICIONES_INMUEBLE.map((c) => <button type="button" key={c} className={`chip ${form.condicion === c ? "chip-active" : ""}`} onClick={() => set("condicion", c)}>{c}</button>)}
        </div>

        {form.condicion === "Proyecto" ? (
          <>
            <Label>Forma de pago / financiación</Label>
            <textarea className="field-input" rows={2} value={form.financiacion} onChange={(e) => set("financiacion", e.target.value)} placeholder="Ej: separación 10%, cuotas durante construcción..." style={{ marginBottom: 14 }} />
          </>
        ) : (
          <Toggle active={form.aceptaPermuta} onClick={() => set("aceptaPermuta", !form.aceptaPermuta)} label="Acepta permuta" />
        )}

        <Label>Título del anuncio</Label>
        <input required className="field-input" style={{ marginBottom: 14 }} value={form.titulo} onChange={(e) => set("titulo", e.target.value)} placeholder="Ej: Apartamento con vista, Chapinero Alto" />

        <Label>Matrícula inmobiliaria (opcional)</Label>
        <input className="field-input" style={{ marginBottom: 8 }} value={form.matricula} onChange={(e) => set("matricula", e.target.value)} placeholder="Identificador oficial del inmueble" />
        <Toggle active={form.matriculaPublica} onClick={() => set("matriculaPublica", !form.matriculaPublica)} label="Privada (solo tú la ves)" sublabel="Visible al público" />

        <Label>Referencia catastral (opcional)</Label>
        <input className="field-input" style={{ marginBottom: 8 }} value={form.referenciaCatastral} onChange={(e) => set("referenciaCatastral", e.target.value)} placeholder="Código catastral del predio" />
        <Toggle active={form.catastralPublica} onClick={() => set("catastralPublica", !form.catastralPublica)} label="Privada (solo tú la ves)" sublabel="Visible al público" />

        <SectionTitle>Ubicación</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 4 }}>
          <div><Label>Departamento</Label><input className="field-input" value={form.departamento} onChange={(e) => set("departamento", e.target.value)} placeholder="Bolívar" /></div>
          <div><Label>Ciudad</Label><input className="field-input" value={form.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Bogotá" /></div>
        </div>
        <Label>Barrio / sector</Label>
        <input className="field-input" style={{ marginBottom: 14 }} value={form.sector} onChange={(e) => set("sector", e.target.value)} placeholder="Chapinero Alto" />
        <Label>Dirección exacta (privada, solo tú la ves)</Label>
        <input className="field-input" style={{ marginBottom: 14 }} value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle 63 # 9-30" />
        <Label>Ubica el inmueble en el mapa</Label>
        <div style={{ marginBottom: 8 }}>
          <MapView mode="picker" value={form.location} onChange={(loc) => set("location", loc)} height={240} />
        </div>
        <Toggle
          active={form.mostrarUbicacionExacta}
          onClick={() => set("mostrarUbicacionExacta", !form.mostrarUbicacionExacta)}
          label="Mostrando solo la zona aproximada (recomendado)"
          sublabel="Mostrando el pin exacto en el mapa"
        />

        <SectionTitle>Negocio</SectionTitle>
        <Label>Valor administración (opcional)</Label>
        <input type="number" className="field-input" style={{ marginBottom: 14 }} value={form.administracion} onChange={(e) => set("administracion", e.target.value)} placeholder="0" />
        <Label>Precio (COP)</Label>
        <input type="number" className="field-input" style={{ marginBottom: 8, opacity: form.precioConsultar ? 0.5 : 1 }} disabled={form.precioConsultar} value={form.precio} onChange={(e) => set("precio", e.target.value)} placeholder="450000000" />
        <Toggle active={form.precioConsultar} onClick={() => set("precioConsultar", !form.precioConsultar)} label="Precio a consultar" />

        <SectionTitle>Especificaciones</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><Label>{cfg.areaTerreno && !cfg.areaPrivada ? "Área (m²)" : "Área construida (m²)"}</Label><input type="number" className="field-input" value={form.area} onChange={(e) => set("area", e.target.value)} /></div>
          {cfg.areaPrivada && <div><Label>Área privada</Label><input type="number" className="field-input" value={form.areaPrivada} onChange={(e) => set("areaPrivada", e.target.value)} /></div>}
          {cfg.areaTerreno && <div><Label>Área de terreno</Label><input type="number" className="field-input" value={form.areaTerreno} onChange={(e) => set("areaTerreno", e.target.value)} /></div>}
          {cfg.hab && <div><Label>Habitaciones</Label><input type="number" className="field-input" value={form.habitaciones} onChange={(e) => set("habitaciones", e.target.value)} /></div>}
          {cfg.banos && <div><Label>Baños</Label><input type="number" className="field-input" value={form.banos} onChange={(e) => set("banos", e.target.value)} /></div>}
          {cfg.parq && <div><Label>Parqueaderos</Label><input type="number" className="field-input" value={form.parqueaderos} onChange={(e) => set("parqueaderos", e.target.value)} /></div>}
          {cfg.piso && <div><Label>Piso de la unidad</Label><input type="number" className="field-input" value={form.piso} onChange={(e) => set("piso", e.target.value)} /></div>}
          {cfg.estrato && <div><Label>Estrato</Label><input type="number" className="field-input" value={form.estrato} onChange={(e) => set("estrato", e.target.value)} /></div>}
          {cfg.anio && <div><Label>Año de construcción</Label><input type="number" className="field-input" value={form.anioConstruccion} onChange={(e) => set("anioConstruccion", e.target.value)} placeholder="Ej: 2018" /></div>}
          {cfg.pisosEdificio && <div><Label>Pisos del edificio</Label><input type="number" className="field-input" value={form.pisosEdificio} onChange={(e) => set("pisosEdificio", e.target.value)} /></div>}
        </div>
        {cfg.banoMedio && cfg.banos && <Toggle active={form.banoMedio} onClick={() => set("banoMedio", !form.banoMedio)} label="Tiene baño medio (auxiliar)" />}

        <SectionTitle>Video y tour virtual (opcional)</SectionTitle>
        <Label>Enlace de video (YouTube, Vimeo...)</Label>
        <input className="field-input" style={{ marginBottom: 14 }} value={form.videoUrl} onChange={(e) => set("videoUrl", e.target.value)} placeholder="https://..." />
        <Label>Enlace de tour virtual 360°</Label>
        <input className="field-input" style={{ marginBottom: 14 }} value={form.tourVirtualUrl} onChange={(e) => set("tourVirtualUrl", e.target.value)} placeholder="https://..." />

        <SectionTitle>Comisión</SectionTitle>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {["Exclusiva", "Compartida"].map((c) => <button type="button" key={c} className={`chip ${form.comision === c ? "chip-active" : ""}`} onClick={() => set("comision", c)}>{c}</button>)}
        </div>
        {form.comision === "Compartida" && (
          <>
            <Label>% de comisión compartida</Label>
            <input type="number" className="field-input" style={{ marginBottom: 14 }} value={form.comisionPct} onChange={(e) => set("comisionPct", e.target.value)} />
          </>
        )}

        <SectionTitle>Descripción</SectionTitle>
        <textarea className="field-input" style={{ marginBottom: 14 }} rows={3} value={form.descripcion} onChange={(e) => set("descripcion", e.target.value)} placeholder="Cuenta qué hace especial a este inmueble..." />

        <SectionTitle>¿Para quién es este inmueble? (opcional)</SectionTitle>
        {form.publicoObjetivo.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            {form.publicoObjetivo.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", borderRadius: 10, background: "var(--color-surface-soft)" }}>
                <span style={{ flex: 1, fontSize: 13.5 }}>{p}</span>
                <button type="button" onClick={() => set("publicoObjetivo", form.publicoObjetivo.filter((_, idx) => idx !== i))} style={{ border: "none", background: "none", color: "var(--color-venta)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          <input
            value={nuevoPublico}
            onChange={(e) => setNuevoPublico(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarPublico(); } }}
            placeholder="Ej: Familias que buscan más espacio"
            className="field-input"
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button type="button" onClick={agregarPublico} className="btn-secondary">+</button>
        </div>

        <SectionTitle>Características internas</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {CARACTERISTICAS_INTERNAS.map((c) => <button type="button" key={c} className={`chip ${form.caracteristicasInternas.includes(c) ? "chip-active" : ""}`} onClick={() => toggleArr("caracteristicasInternas", c)}>{c}</button>)}
        </div>

        <SectionTitle>Características externas</SectionTitle>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {CARACTERISTICAS_EXTERNAS.map((c) => <button type="button" key={c} className={`chip ${form.caracteristicasExternas.includes(c) ? "chip-active" : ""}`} onClick={() => toggleArr("caracteristicasExternas", c)}>{c}</button>)}
        </div>

        <SectionTitle>Fotos (hasta 20)</SectionTitle>
        <input type="file" accept="image/*" multiple onChange={onImageChange} />
        {(existingImages.length > 0 || imagePreviews.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
            {existingImages.map((url, i) => (
              <div key={`e${i}`} style={{ position: "relative", width: 84, height: 84 }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                {i === 0 && <span style={{ position: "absolute", bottom: 2, left: 2, right: 2, textAlign: "center", fontSize: 9, fontWeight: 700, background: "rgba(0,0,0,0.6)", color: "white", borderRadius: 6, padding: "1px 0" }}>Portada</span>}
                <button type="button" onClick={() => removeExistingImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--color-venta)", color: "white", border: "2px solid white", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            ))}
            {imagePreviews.map((url, i) => (
              <div key={`n${i}`} style={{ position: "relative", width: 84, height: 84 }}>
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
                <button type="button" onClick={() => removeNewImage(i)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: "var(--color-venta)", color: "white", border: "2px solid white", fontSize: 11, cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize: 11.5, color: "var(--color-muted)", margin: "8px 0 0" }}>{existingImages.length + imagePreviews.length}/20 fotos. La primera foto queda como portada.</p>

        <SectionTitle>Datos del propietario (privado, no se publica)</SectionTitle>
        <input className="field-input" style={{ marginBottom: 10 }} value={form.ownerNombre} onChange={(e) => set("ownerNombre", e.target.value)} placeholder="Nombre del propietario" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          <input className="field-input" style={{ marginBottom: 0 }} value={form.ownerTelefono} onChange={(e) => set("ownerTelefono", e.target.value)} placeholder="Teléfono" />
          <input className="field-input" style={{ marginBottom: 0 }} value={form.ownerCorreo} onChange={(e) => set("ownerCorreo", e.target.value)} placeholder="Correo" />
        </div>
        <Label>Observaciones internas (privadas)</Label>
        <textarea className="field-input" style={{ marginBottom: 14 }} rows={2} value={form.observaciones} onChange={(e) => set("observaciones", e.target.value)} placeholder="Notas para ti o tu equipo, no se publican" />

        <SectionTitle>Aspectos destacados de la zona (opcional)</SectionTitle>
        <textarea className="field-input" style={{ marginBottom: 8 }} rows={3} value={form.descripcionZona} onChange={(e) => set("descripcionZona", e.target.value)} placeholder="Ej: a 5 minutos del centro comercial, cerca a colegios..." />

        {error && <div style={{ color: "#b3401f", fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <button className="btn-primary" disabled={sending} type="submit" style={{ marginTop: 8 }}>
          {sending ? "Guardando…" : editing ? "Guardar cambios" : "Publicar inmueble"}
        </button>
      </form>
    </div>
  );
}
