import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";

const ESTADOS = ["Nuevo", "Contactado", "Cerrado", "Descartado"];
const ESTADO_COLOR = {
  Nuevo: "#DC5A2E",
  Contactado: "#4C6FDC",
  Cerrado: "#2E9E5B",
  Descartado: "#8a7f76",
};

export default function Crm({ navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    let active = true;
    setLoading(true);
    supabase
      .from("leads")
      .select("*, listings(titulo)")
      .eq("advisor_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) {
          setLeads(data || []);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isLoggedIn, user]);

  async function updateEstado(leadId, estado) {
    setLeads((prev) => prev.map((l) => (l.id === leadId ? { ...l, estado } : l)));
    await supabase.from("leads").update({ estado }).eq("id", leadId);
  }

  if (!isLoggedIn) {
    return (
      <div className="container" style={{ padding: 40 }}>
        Inicia sesión para ver tu CRM. <button className="btn-secondary" onClick={() => navigate("auth")}>Iniciar sesión</button>
      </div>
    );
  }

  const stats = ESTADOS.map((e) => ({ estado: e, count: leads.filter((l) => l.estado === e).length }));

  return (
    <div className="container" style={{ padding: "28px 24px 60px" }}>
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: 24, margin: "0 0 18px" }}>CRM de leads</h1>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
        {stats.map((s) => (
          <div key={s.estado} className="card" style={{ padding: "14px 18px", minWidth: 120 }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: ESTADO_COLOR[s.estado] }}>{s.count}</div>
            <div style={{ fontSize: 12, color: "var(--color-muted)" }}>{s.estado}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="skeleton" style={{ height: 200 }} />
      ) : leads.length === 0 ? (
        <div className="card" style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>
          Todavía no has recibido leads. Cuando alguien escriba desde uno de tus inmuebles, aparecerá aquí.
        </div>
      ) : (
        <div className="card" style={{ overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: "var(--color-surface-soft)", textAlign: "left" }}>
                <th style={{ padding: "10px 14px" }}>Nombre</th>
                <th style={{ padding: "10px 14px" }} className="hide-mobile">Inmueble</th>
                <th style={{ padding: "10px 14px" }} className="hide-mobile">Contacto</th>
                <th style={{ padding: "10px 14px" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} style={{ borderTop: "1px solid var(--color-border)" }}>
                  <td style={{ padding: "10px 14px", fontWeight: 600 }}>{l.nombre}</td>
                  <td style={{ padding: "10px 14px" }} className="hide-mobile">{l.listings?.titulo || "—"}</td>
                  <td style={{ padding: "10px 14px" }} className="hide-mobile">{l.email || l.telefono}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <select
                      className="field-input"
                      style={{ padding: "5px 8px", fontSize: 12.5 }}
                      value={l.estado}
                      onChange={(e) => updateEstado(l.id, e.target.value)}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>{e}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
