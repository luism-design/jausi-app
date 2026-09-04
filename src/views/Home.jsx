import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import PropertyCard from "../components/PropertyCard.jsx";
import { PROPERTY_TYPES, PRESUPUESTO_OPTIONS, matchesPresupuesto } from "../lib/utils.js";

export default function Home({ navigate }) {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [tipo, setTipo] = useState("Ambos"); // Venta | Arriendo | Ambos
  const [searchText, setSearchText] = useState("");
  const [searchTipoInmueble, setSearchTipoInmueble] = useState("Todos");
  const [presupuesto, setPresupuesto] = useState("Todos");

  useEffect(() => {
    let active = true;
    setLoading(true);
    supabase
      .from("listings")
      .select("*")
      .eq("estado", "Publicado")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setError(error.message);
        else setListings(data || []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return listings.filter((l) => {
      if (tipo !== "Ambos" && l.tipo_negocio !== tipo) return false;
      if (searchTipoInmueble !== "Todos" && l.tipo_inmueble !== searchTipoInmueble) return false;
      if (!matchesPresupuesto(Number(l.precio), presupuesto)) return false;
      if (searchText.trim()) {
        const q = searchText.toLowerCase();
        const haystack = `${l.titulo} ${l.sector} ${l.ciudad}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [listings, tipo, searchTipoInmueble, presupuesto, searchText]);

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      {/* Hero + búsqueda */}
      <div style={{ borderBottom: "1px solid var(--color-border)", background: "linear-gradient(180deg, #fff, var(--color-bg))" }}>
        <div className="container" style={{ padding: "48px 24px 28px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 34, fontWeight: 800, margin: "0 0 8px", letterSpacing: "-0.5px" }}>
            Encuentra tu próximo hogar
          </h1>
          <p style={{ color: "var(--color-muted)", margin: "0 0 24px", fontSize: 15 }}>
            Compra o arrienda inmuebles verificados en toda Colombia.
          </p>

          <div style={{ display: "inline-flex", gap: 6, background: "var(--color-surface-soft)", borderRadius: 999, padding: 4, marginBottom: 20 }}>
            {["Venta", "Arriendo", "Ambos"].map((t) => (
              <button
                key={t}
                className={`pill-btn ${tipo === t ? "pill-btn-active" : "pill-btn-base"}`}
                onClick={() => setTipo(t)}
              >
                {t === "Ambos" ? "Todos" : t}
              </button>
            ))}
          </div>

          <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 0, overflow: "hidden" }}>
            <input
              className="field-input"
              style={{ flex: "2 1 220px", border: "none", borderRadius: 0, borderRight: "1px solid var(--color-border)" }}
              placeholder="Busca por sector, ciudad o título…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <select
              className="field-input"
              style={{ flex: "1 1 160px", border: "none", borderRadius: 0, borderRight: "1px solid var(--color-border)" }}
              value={searchTipoInmueble}
              onChange={(e) => setSearchTipoInmueble(e.target.value)}
            >
              {["Todos", ...PROPERTY_TYPES].map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
            <select
              className="field-input"
              style={{ flex: "1 1 180px", border: "none", borderRadius: 0 }}
              value={presupuesto}
              onChange={(e) => setPresupuesto(e.target.value)}
            >
              {PRESUPUESTO_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Resultados */}
      <div className="container" style={{ padding: "28px 24px 60px" }}>
        <div style={{ fontSize: 13, color: "var(--color-muted)", marginBottom: 14 }}>
          {loading ? "Cargando inmuebles…" : `${filtered.length} inmueble${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`}
        </div>

        {error && (
          <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "#e3b6a4", background: "#fdf1ec", color: "#9a3f1f" }}>
            No se pudieron cargar los inmuebles: {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 240 }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Todavía no hay inmuebles que coincidan</div>
            <div style={{ color: "var(--color-muted)", fontSize: 14 }}>
              Ajusta los filtros o sé el primero en publicar un inmueble.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
            {filtered.map((l) => (
              <PropertyCard key={l.id} listing={l} onOpen={(id) => navigate("detail", id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
