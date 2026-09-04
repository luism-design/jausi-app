import { useState } from "react";
import { ETAPA_COLOR, TIPOS_TAREA } from "../lib/utils.js";

export default function LeadDetailPanel({ lead, onClose, tasks, citas, onAddTask, onToggleTask, onDeleteTask, onAddCita, onDeleteCita, onSaveNotas, onEdit, onVerInmueble }) {
  const [notas, setNotas] = useState(lead.notas || "");
  const [notasGuardadas, setNotasGuardadas] = useState(true);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [tareaFecha, setTareaFecha] = useState("");
  const [tareaTipo, setTareaTipo] = useState("Llamada");
  const [tareaHora, setTareaHora] = useState("");
  const [citaFecha, setCitaFecha] = useState("");
  const [citaHora, setCitaHora] = useState("");
  const [citaNota, setCitaNota] = useState("");

  const misTareas = tasks.filter((t) => t.lead_id === lead.id);
  const misCitas = citas.filter((c) => c.lead_id === lead.id).sort((a, b) => `${a.fecha}${a.hora || ""}`.localeCompare(`${b.fecha}${b.hora || ""}`));
  const c = ETAPA_COLOR[lead.etapa] || { bg: "var(--color-surface-soft)", fg: "var(--color-muted)" };

  function guardarNotas() {
    onSaveNotas(lead.id, notas);
    setNotasGuardadas(true);
  }
  function agregarTarea() {
    if (!nuevaTarea.trim()) return;
    onAddTask(lead.id, nuevaTarea.trim(), tareaFecha, tareaTipo, tareaHora);
    setNuevaTarea("");
    setTareaFecha("");
    setTareaHora("");
  }
  function agregarCita() {
    if (!citaFecha) return;
    onAddCita(lead.id, citaFecha, citaHora, citaNota.trim());
    setCitaFecha("");
    setCitaHora("");
    setCitaNota("");
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "#fff", overflowY: "auto" }}>
      <div style={{ position: "sticky", top: 0, background: "#fff", borderBottom: "1px solid var(--color-border)", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button className="btn-secondary" onClick={onClose}>← Volver</button>
        <button className="btn-secondary" onClick={onEdit}>✎ Editar</button>
      </div>

      <div className="container" style={{ padding: "24px 24px 60px", maxWidth: 640 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0 }}>{lead.nombre}</h2>
          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: c.bg, color: c.fg }}>{lead.etapa}</span>
        </div>
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 10, fontSize: 13.5, color: "var(--color-muted)" }}>
          {lead.telefono && <span>📞 {lead.telefono}</span>}
          {lead.email && <span>✉ {lead.email}</span>}
        </div>

        {lead.listing_id ? (
          <button className="btn-secondary" onClick={() => onVerInmueble(lead.listing_id)} style={{ marginBottom: 16 }}>Ver inmueble de interés</button>
        ) : (
          <div style={{ fontSize: 13.5, marginBottom: 16 }}>{lead.tipo_inmueble} en {lead.ciudad} · {lead.operacion}</div>
        )}

        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-venta)", fontWeight: 700, margin: "18px 0 8px" }}>Notas</p>
        <textarea
          className="field-input"
          rows={3}
          value={notas}
          onChange={(e) => { setNotas(e.target.value); setNotasGuardadas(false); }}
          placeholder="Anota aquí el historial de esta relación: llamadas, acuerdos, preferencias..."
        />
        {!notasGuardadas && <button className="btn-secondary" onClick={guardarNotas} style={{ marginBottom: 16 }}>Guardar notas</button>}

        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-venta)", fontWeight: 700, margin: "18px 0 8px" }}>Tareas</p>
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <select className="field-input" value={tareaTipo} onChange={(e) => setTareaTipo(e.target.value)} style={{ marginBottom: 8 }}>
            {TIPOS_TAREA.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className="field-input" value={nuevaTarea} onChange={(e) => setNuevaTarea(e.target.value)} placeholder="Motivo — ej. Llamar para confirmar visita" style={{ marginBottom: 8 }} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
            <input type="date" className="field-input" style={{ marginBottom: 0 }} value={tareaFecha} onChange={(e) => setTareaFecha(e.target.value)} />
            <input type="time" className="field-input" style={{ marginBottom: 0 }} value={tareaHora} onChange={(e) => setTareaHora(e.target.value)} />
          </div>
          <button className="btn-primary" onClick={agregarTarea} style={{ width: "100%" }}>+ Agregar tarea</button>
        </div>
        {misTareas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
            {misTareas.map((t) => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--color-surface-soft)" }}>
                <button
                  onClick={() => onToggleTask(t.id)}
                  style={{ width: 18, height: 18, borderRadius: "50%", border: t.completada ? "none" : "2px solid var(--color-border)", background: t.completada ? "var(--color-arriendo)" : "transparent", flexShrink: 0, color: "white", fontSize: 11 }}
                >
                  {t.completada ? "✓" : ""}
                </button>
                <span style={{ flex: 1, fontSize: 13, textDecoration: t.completada ? "line-through" : "none", color: t.completada ? "var(--color-muted)" : "var(--color-ink)" }}>
                  {t.tipo} · {t.texto}{t.fecha ? ` · ${t.fecha}${t.hora ? " " + t.hora : ""}` : ""}
                </span>
                <button onClick={() => onDeleteTask(t.id)} style={{ border: "none", background: "none", color: "var(--color-venta)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        )}

        <p style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--color-venta)", fontWeight: 700, margin: "18px 0 8px" }}>Citas</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
          <input type="date" className="field-input" style={{ marginBottom: 0 }} value={citaFecha} onChange={(e) => setCitaFecha(e.target.value)} />
          <input type="time" className="field-input" style={{ marginBottom: 0 }} value={citaHora} onChange={(e) => setCitaHora(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <input className="field-input" style={{ marginBottom: 0, flex: 1 }} value={citaNota} onChange={(e) => setCitaNota(e.target.value)} placeholder="Nota (ej. Visita al apartamento)" />
          <button className="btn-secondary" onClick={agregarCita}>+</button>
        </div>
        {misCitas.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {misCitas.map((c2) => (
              <div key={c2.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 10, background: "var(--color-surface-soft)" }}>
                <span style={{ fontSize: 12.5, fontWeight: 700 }}>{c2.fecha}{c2.hora ? ` ${c2.hora}` : ""}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{c2.nota}</span>
                <button onClick={() => onDeleteCita(c2.id)} style={{ border: "none", background: "none", color: "var(--color-venta)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
