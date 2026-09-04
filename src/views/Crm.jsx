import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import { ETAPAS_EMBUDO, ETAPA_COLOR, TIPOS_TAREA } from "../lib/utils.js";
import LeadForm from "../components/LeadForm.jsx";
import LeadDetailPanel from "../components/LeadDetailPanel.jsx";

export default function Crm({ navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [leads, setLeads] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  const [vista, setVista] = useState("embudo");
  const [busqueda, setBusqueda] = useState("");
  const [filtroEtapa, setFiltroEtapa] = useState("Todas");
  const [formLead, setFormLead] = useState(null); // null | "nuevo" | lead object
  const [leadDetalle, setLeadDetalle] = useState(null);
  const [confirmando, setConfirmando] = useState(null);

  async function loadAll() {
    setLoading(true);
    const [{ data: l }, { data: t }, { data: c }] = await Promise.all([
      supabase.from("leads").select("*, listings(titulo)").eq("advisor_id", user.id).order("created_at", { ascending: false }),
      supabase.from("crm_tasks").select("*").eq("agent_id", user.id).order("created_at", { ascending: false }),
      supabase.from("crm_citas").select("*").eq("agent_id", user.id).order("created_at", { ascending: false }),
    ]);
    setLeads(l || []);
    setTasks(t || []);
    setCitas(c || []);
    setLoading(false);
  }

  useEffect(() => {
    if (isLoggedIn) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user]);

  async function addLead(data) {
    const { data: nuevo, error } = await supabase.from("leads").insert({
      advisor_id: user.id,
      nombre: data.nombre,
      telefono: data.telefono,
      email: data.email,
      ciudad: data.ciudad,
      tipo_inmueble: data.tipoInmueble,
      operacion: data.operacion,
      etapa: data.etapa,
      origen: "Manual",
    }).select("*, listings(titulo)").single();
    if (!error) setLeads((ls) => [nuevo, ...ls]);
    setFormLead(null);
  }

  async function updateLead(id, patch) {
    const dbPatch = {
      nombre: patch.nombre, telefono: patch.telefono, email: patch.email, ciudad: patch.ciudad,
      tipo_inmueble: patch.tipoInmueble, operacion: patch.operacion, etapa: patch.etapa,
    };
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, ...dbPatch } : l)));
    await supabase.from("leads").update(dbPatch).eq("id", id);
    setFormLead(null);
  }

  async function deleteLead(id) {
    setLeads((ls) => ls.filter((l) => l.id !== id));
    setTasks((ts) => ts.filter((t) => t.lead_id !== id));
    setCitas((cs) => cs.filter((c) => c.lead_id !== id));
    await supabase.from("leads").delete().eq("id", id);
  }

  async function moveStage(id, etapa) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, etapa } : l)));
    await supabase.from("leads").update({ etapa }).eq("id", id);
  }

  async function saveNotas(id, notas) {
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, notas } : l)));
    await supabase.from("leads").update({ notas }).eq("id", id);
  }

  async function addTask(leadId, texto, fecha, tipo, hora) {
    const { data, error } = await supabase.from("crm_tasks").insert({
      agent_id: user.id, lead_id: leadId, texto, fecha: fecha || null, hora: hora || null, tipo,
    }).select().single();
    if (!error) setTasks((ts) => [data, ...ts]);
  }
  async function toggleTask(id) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, completada: !t.completada } : t)));
    const t = tasks.find((x) => x.id === id);
    await supabase.from("crm_tasks").update({ completada: !t.completada }).eq("id", id);
  }
  async function deleteTask(id) {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    await supabase.from("crm_tasks").delete().eq("id", id);
  }

  async function addCita(leadId, fecha, hora, nota) {
    const { data, error } = await supabase.from("crm_citas").insert({
      agent_id: user.id, lead_id: leadId, fecha, hora: hora || null, nota,
    }).select().single();
    if (!error) setCitas((cs) => [data, ...cs]);
  }
  async function deleteCita(id) {
    setCitas((cs) => cs.filter((c) => c.id !== id));
    await supabase.from("crm_citas").delete().eq("id", id);
  }

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: 40 }}>
        Inicia sesión para ver tu CRM. <button className="btn-secondary" onClick={() => navigate("auth")}>Iniciar sesión</button>
      </div>
    );
  }
  if (loading) return <div className="container" style={{ padding: 40 }}>Cargando CRM…</div>;

  const porNombre = (l) => !busqueda.trim() || l.nombre.toLowerCase().includes(busqueda.trim().toLowerCase());
  const listaFiltrada = (filtroEtapa === "Todas" ? leads : leads.filter((l) => l.etapa === filtroEtapa)).filter(porNombre);
  const ganados = leads.filter((l) => l.etapa === "Ganado").length;
  const nuevosCount = leads.filter((l) => l.etapa === "Nuevo").length;
  const tasaConversion = leads.length > 0 ? Math.round((ganados / leads.length) * 100) : 0;
  const hoy = new Date().toISOString().slice(0, 10);
  const proximaCita = [...citas].filter((c) => c.fecha >= hoy).sort((a, b) => `${a.fecha}${a.hora || ""}`.localeCompare(`${b.fecha}${b.hora || ""}`))[0];

  const leadActual = leadDetalle ? leads.find((l) => l.id === leadDetalle.id) : null;
  if (leadDetalle && !leadActual) setLeadDetalle(null);

  return (
    <div className="container" style={{ padding: "24px 24px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: 0 }}>Clientes</h1>
        <button className="btn-primary" onClick={() => setFormLead("nuevo")}>+ Contacto</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 18 }}>
        {[["Contactos", leads.length], ["Nuevos", nuevosCount], ["Conversión", `${tasaConversion}%`], ["Próx. cita", proximaCita ? proximaCita.fecha.slice(5) : "—"]].map(([label, value]) => (
          <div key={label} className="card" style={{ padding: "12px 8px", textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{value}</div>
            <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "inline-flex", gap: 4, background: "var(--color-surface-soft)", borderRadius: 999, padding: 4, marginBottom: 18 }}>
        {[["embudo", "Embudo"], ["lista", "Lista"], ["tareas", "Tareas"], ["calendario", "Calendario"]].map(([v, l]) => (
          <button key={v} className={`pill-btn ${vista === v ? "pill-btn-active" : "pill-btn-base"}`} onClick={() => setVista(v)}>{l}</button>
        ))}
      </div>

      {(vista === "embudo" || vista === "lista") && (
        <input className="field-input" style={{ maxWidth: 320, marginBottom: 16 }} placeholder="Buscar contacto por nombre…" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
      )}

      {leads.length === 0 && vista !== "tareas" && vista !== "calendario" ? (
        <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
          Todavía no tienes clientes registrados. Agrega uno manualmente o espera a que alguien te escriba desde una ficha de inmueble.
        </div>
      ) : vista === "embudo" ? (
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 10 }}>
          {ETAPAS_EMBUDO.map((etapa) => {
            const items = leads.filter((l) => l.etapa === etapa).filter(porNombre);
            const c = ETAPA_COLOR[etapa];
            return (
              <div key={etapa} style={{ width: 240, flexShrink: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, padding: "4px 12px", borderRadius: 999, background: c.bg, color: c.fg }}>{etapa}</span>
                  <span style={{ fontSize: 12, color: "var(--color-muted)" }}>{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p style={{ fontSize: 12, textAlign: "center", color: "var(--color-muted)", padding: "20px 0" }}>—</p>
                ) : (
                  items.map((l) => {
                    const idx = ETAPAS_EMBUDO.indexOf(l.etapa);
                    return (
                      <div key={l.id} className="card" style={{ padding: 12, marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
                          <button onClick={() => setLeadDetalle(l)} style={{ background: "none", border: "none", fontSize: 13.5, fontWeight: 700, textDecoration: "underline", cursor: "pointer", textAlign: "left", padding: 0 }}>{l.nombre}</button>
                          <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                            <button onClick={() => setFormLead(l)} style={{ border: "none", background: "var(--color-surface-soft)", borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontSize: 11 }}>✎</button>
                            {confirmando === l.id ? (
                              <button onClick={() => { deleteLead(l.id); setConfirmando(null); }} style={{ border: "none", background: "var(--color-venta)", color: "white", borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontSize: 10 }}>¿Seguro?</button>
                            ) : (
                              <button onClick={() => setConfirmando(l.id)} style={{ border: "none", background: "var(--color-venta-soft)", borderRadius: 6, padding: "2px 6px", cursor: "pointer", fontSize: 11, color: "var(--color-venta)" }}>✕</button>
                            )}
                          </div>
                        </div>
                        {l.listing_id ? (
                          <button onClick={() => navigate("detail", l.listing_id)} style={{ background: "none", border: "none", padding: 0, fontSize: 12, textAlign: "left", textDecoration: "underline", color: "var(--color-venta)", cursor: "pointer", marginBottom: 6 }}>{l.listings?.titulo || "Inmueble"}</button>
                        ) : (
                          <div style={{ fontSize: 12, color: "var(--color-muted)", marginBottom: 6 }}>{l.tipo_inmueble} en {l.ciudad} · {l.operacion}</div>
                        )}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontSize: 11.5, color: "var(--color-muted)", marginBottom: 8 }}>
                          {l.telefono && <span>📞 {l.telefono}</span>}
                          {l.email && <span>✉ {l.email}</span>}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: "var(--color-surface-soft)", color: "var(--color-muted)" }}>{l.origen}</span>
                          <div style={{ display: "flex", gap: 4 }}>
                            {idx > 0 && <button onClick={() => moveStage(l.id, ETAPAS_EMBUDO[idx - 1])} style={{ border: "none", background: "var(--color-surface-soft)", borderRadius: 6, width: 22, height: 22, cursor: "pointer" }}>‹</button>}
                            {idx < ETAPAS_EMBUDO.length - 1 && <button onClick={() => moveStage(l.id, ETAPAS_EMBUDO[idx + 1])} style={{ border: "none", background: "var(--color-ink)", color: "white", borderRadius: 6, width: 22, height: 22, cursor: "pointer" }}>›</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      ) : vista === "lista" ? (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {["Todas", ...ETAPAS_EMBUDO].map((e) => (
              <button key={e} className={`chip ${filtroEtapa === e ? "chip-active" : ""}`} onClick={() => setFiltroEtapa(e)}>{e}</button>
            ))}
          </div>
          <div className="card" style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--color-surface-soft)", textAlign: "left" }}>
                  <th style={{ padding: "10px 14px" }}>Nombre</th>
                  <th style={{ padding: "10px 14px" }} className="hide-mobile">Contacto</th>
                  <th style={{ padding: "10px 14px" }} className="hide-mobile">Inmueble</th>
                  <th style={{ padding: "10px 14px" }}>Etapa</th>
                  <th style={{ padding: "10px 14px" }}></th>
                </tr>
              </thead>
              <tbody>
                {listaFiltrada.map((l) => {
                  const c = ETAPA_COLOR[l.etapa];
                  return (
                    <tr key={l.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <button onClick={() => setLeadDetalle(l)} style={{ background: "none", border: "none", fontWeight: 700, textDecoration: "underline", cursor: "pointer", padding: 0 }}>{l.nombre}</button>
                      </td>
                      <td style={{ padding: "10px 14px" }} className="hide-mobile">{l.telefono || l.email || "—"}</td>
                      <td style={{ padding: "10px 14px" }} className="hide-mobile">
                        {l.listing_id ? <button onClick={() => navigate("detail", l.listing_id)} style={{ background: "none", border: "none", color: "var(--color-venta)", textDecoration: "underline", cursor: "pointer", padding: 0 }}>{l.listings?.titulo}</button> : `${l.tipo_inmueble || ""} (${l.ciudad || ""})`}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <select className="field-input" style={{ padding: "5px 8px", fontSize: 12, marginBottom: 0 }} value={l.etapa} onChange={(e) => moveStage(l.id, e.target.value)}>
                          {ETAPAS_EMBUDO.map((e) => <option key={e}>{e}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => setFormLead(l)} className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11 }}>✎</button>
                          {confirmando === l.id ? (
                            <button onClick={() => { deleteLead(l.id); setConfirmando(null); }} style={{ border: "none", background: "var(--color-venta)", color: "white", borderRadius: 999, padding: "4px 8px", fontSize: 10, cursor: "pointer" }}>¿Seguro?</button>
                          ) : (
                            <button onClick={() => setConfirmando(l.id)} className="btn-secondary" style={{ padding: "4px 8px", fontSize: 11, color: "var(--color-venta)" }}>✕</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : vista === "tareas" ? (
        <TasksView leads={leads} tasks={tasks} onAdd={addTask} onToggle={toggleTask} onDelete={deleteTask} />
      ) : (
        <CalendarView leads={leads} tasks={tasks} citas={citas} onAdd={addCita} onDelete={deleteCita} />
      )}

      {formLead && (
        <LeadForm
          initial={formLead === "nuevo" ? null : formLead}
          onClose={() => setFormLead(null)}
          onSubmit={(data) => (formLead === "nuevo" ? addLead(data) : updateLead(formLead.id, data))}
        />
      )}

      {leadActual && (
        <LeadDetailPanel
          lead={leadActual}
          onClose={() => setLeadDetalle(null)}
          tasks={tasks}
          citas={citas}
          onAddTask={addTask}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onAddCita={addCita}
          onDeleteCita={deleteCita}
          onSaveNotas={saveNotas}
          onEdit={() => setFormLead(leadActual)}
          onVerInmueble={(lid) => navigate("detail", lid)}
        />
      )}
    </div>
  );
}

function TasksView({ leads, tasks, onAdd, onToggle, onDelete }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [leadId, setLeadId] = useState(leads[0]?.id || "");
  const [tipoTarea, setTipoTarea] = useState("Llamada");
  const [texto, setTexto] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const pendientes = tasks.filter((t) => !t.completada).sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const completadas = tasks.filter((t) => t.completada);
  const nombreLead = (id) => leads.find((l) => l.id === id)?.nombre || "Contacto eliminado";

  function guardar() {
    if (!texto.trim() || !leadId) return;
    onAdd(leadId, texto.trim(), fecha, tipoTarea, hora);
    setTexto(""); setFecha(""); setHora(""); setMostrarForm(false);
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16, maxWidth: 320 }}>
        <div className="card" style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--color-arriendo)" }}>{completadas.length}</div>
          <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>Gestionadas</div>
        </div>
        <div className="card" style={{ padding: 12, textAlign: "center" }}>
          <div style={{ fontWeight: 800, fontSize: 18, color: "var(--color-venta)" }}>{pendientes.length}</div>
          <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>Pendientes</div>
        </div>
      </div>

      {!mostrarForm ? (
        <button className="btn-primary" onClick={() => setMostrarForm(true)} style={{ marginBottom: 16 }}>+ Nueva tarea</button>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 16, maxWidth: 400 }}>
          <select className="field-input" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          <select className="field-input" value={tipoTarea} onChange={(e) => setTipoTarea(e.target.value)}>
            {TIPOS_TAREA.map((t) => <option key={t}>{t}</option>)}
          </select>
          <input className="field-input" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Motivo — ej. Llamar para confirmar visita" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
            <input type="date" className="field-input" style={{ marginBottom: 0 }} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <input type="time" className="field-input" style={{ marginBottom: 0 }} value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={guardar}>Guardar</button>
          </div>
        </div>
      )}

      <p style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-venta)", fontWeight: 700, marginBottom: 8 }}>Pendientes ({pendientes.length})</p>
      {pendientes.length === 0 ? <p style={{ fontSize: 13.5, color: "var(--color-muted)", marginBottom: 20 }}>No tienes tareas pendientes.</p> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {pendientes.map((t) => (
            <div key={t.id} className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 10 }}>
              <button onClick={() => onToggle(t.id)} style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid var(--color-border)", background: "none", flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5 }}>{t.texto}</div>
                <div style={{ fontSize: 11.5, color: "var(--color-muted)" }}>{t.tipo} · {nombreLead(t.lead_id)}{t.fecha ? ` · ${t.fecha}${t.hora ? " " + t.hora : ""}` : ""}</div>
              </div>
              <button onClick={() => onDelete(t.id)} style={{ border: "none", background: "none", color: "var(--color-venta)", cursor: "pointer" }}>✕</button>
            </div>
          ))}
        </div>
      )}
      {completadas.length > 0 && (
        <>
          <p style={{ fontSize: 11, textTransform: "uppercase", color: "var(--color-muted)", fontWeight: 700, marginBottom: 8 }}>Gestionadas ({completadas.length})</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {completadas.map((t) => (
              <div key={t.id} style={{ padding: 12, borderRadius: 12, background: "var(--color-surface-soft)", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--color-arriendo)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>✓</span>
                <span style={{ flex: 1, fontSize: 13.5, textDecoration: "line-through", color: "var(--color-muted)" }}>{t.texto}</span>
                <button onClick={() => onDelete(t.id)} style={{ border: "none", background: "none", color: "var(--color-venta)", cursor: "pointer" }}>✕</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CalendarView({ leads, tasks, citas, onAdd, onDelete }) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [leadId, setLeadId] = useState(leads[0]?.id || "");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [nota, setNota] = useState("");
  const nombreLead = (id) => leads.find((l) => l.id === id)?.nombre || "Contacto eliminado";

  const eventosTareas = tasks.filter((t) => t.fecha).map((t) => ({ id: `tarea-${t.id}`, leadId: t.lead_id, fecha: t.fecha, hora: t.hora || "", nota: `${t.tipo}: ${t.texto}` }));
  const eventosCitas = citas.map((c) => ({ id: `cita-${c.id}`, leadId: c.lead_id, fecha: c.fecha, hora: c.hora || "", nota: c.nota }));
  const ordenadas = [...eventosTareas, ...eventosCitas].sort((a, b) => `${a.fecha}${a.hora}`.localeCompare(`${b.fecha}${b.hora}`));

  function guardar() {
    if (!leadId || !fecha) return;
    onAdd(leadId, fecha, hora, nota.trim());
    setFecha(""); setHora(""); setNota(""); setMostrarForm(false);
  }

  return (
    <div>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 14 }}>Aquí se ven juntas tus citas y las tareas con fecha que hayas agendado por contacto.</p>
      {!mostrarForm ? (
        <button className="btn-primary" onClick={() => setMostrarForm(true)} style={{ marginBottom: 16 }}>+ Nueva cita</button>
      ) : (
        <div className="card" style={{ padding: 14, marginBottom: 16, maxWidth: 400 }}>
          <select className="field-input" value={leadId} onChange={(e) => setLeadId(e.target.value)}>
            {leads.map((l) => <option key={l.id} value={l.id}>{l.nombre}</option>)}
          </select>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input type="date" className="field-input" style={{ marginBottom: 0 }} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            <input type="time" className="field-input" style={{ marginBottom: 0 }} value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
          <input className="field-input" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="Ej. Visita al apartamento" />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setMostrarForm(false)}>Cancelar</button>
            <button className="btn-primary" style={{ flex: 1 }} onClick={guardar}>Guardar</button>
          </div>
        </div>
      )}
      {ordenadas.length === 0 ? (
        <p style={{ textAlign: "center", padding: "40px 0", color: "var(--color-muted)" }}>No tienes citas ni tareas agendadas.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {ordenadas.map((c) => (
            <div key={c.id} className="card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "center", padding: "4px 10px", borderRadius: 8, background: "var(--color-surface-soft)", flexShrink: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{c.fecha}</div>
                {c.hora && <div style={{ fontSize: 10.5, color: "var(--color-muted)" }}>{c.hora}</div>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{nombreLead(c.leadId)}</div>
                <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{c.nota}</div>
              </div>
              {c.id.startsWith("cita-") && (
                <button onClick={() => onDelete(c.id.replace("cita-", ""))} style={{ border: "none", background: "none", color: "var(--color-venta)", cursor: "pointer" }}>✕</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
