import { useState } from "react";
import { TIPOS_INMUEBLE, TIPOS_OPERACION_LEAD, ETAPAS_EMBUDO } from "../lib/utils.js";

export default function LeadForm({ initial, onClose, onSubmit }) {
  const [f, setF] = useState(
    initial
      ? {
          nombre: initial.nombre || "",
          telefono: initial.telefono || "",
          email: initial.email || "",
          ciudad: initial.ciudad || "",
          tipoInmueble: initial.tipo_inmueble || "Apartamento",
          operacion: initial.operacion || "Comprar",
          etapa: initial.etapa || "Nuevo",
        }
      : { nombre: "", telefono: "", email: "", ciudad: "", tipoInmueble: "Apartamento", operacion: "Comprar", etapa: "Nuevo" }
  );
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));
  const puedeGuardar = f.nombre.trim() && (f.telefono.trim() || f.email.trim());

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div className="card" style={{ width: "100%", maxWidth: 420, maxHeight: "90vh", overflowY: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 18, margin: 0 }}>{initial ? "Editar contacto" : "Nuevo contacto"}</h3>
          <button onClick={onClose} style={{ border: "none", background: "none", fontSize: 18, cursor: "pointer", color: "var(--color-muted)" }}>✕</button>
        </div>

        <label className="field-label">Nombre</label>
        <input className="field-input" value={f.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre completo" />
        <label className="field-label">Teléfono</label>
        <input className="field-input" value={f.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="300 000 0000" />
        <label className="field-label">Correo</label>
        <input className="field-input" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="correo@ejemplo.com" />
        <label className="field-label">Ciudad</label>
        <input className="field-input" value={f.ciudad} onChange={(e) => set("ciudad", e.target.value)} placeholder="Bogotá" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label className="field-label">Tipo de inmueble</label>
            <select className="field-input" value={f.tipoInmueble} onChange={(e) => set("tipoInmueble", e.target.value)}>
              {TIPOS_INMUEBLE.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="field-label">Quiere</label>
            <select className="field-input" value={f.operacion} onChange={(e) => set("operacion", e.target.value)}>
              {TIPOS_OPERACION_LEAD.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <label className="field-label">Etapa</label>
        <select className="field-input" value={f.etapa} onChange={(e) => set("etapa", e.target.value)}>
          {ETAPAS_EMBUDO.map((e) => <option key={e}>{e}</option>)}
        </select>

        <button className="btn-primary" disabled={!puedeGuardar} onClick={() => onSubmit(f)} style={{ width: "100%", marginTop: 8 }}>
          {initial ? "Guardar cambios" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
