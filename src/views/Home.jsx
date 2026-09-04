import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../lib/AuthContext.jsx";
import PropertyCard from "../components/PropertyCard.jsx";
import MapView from "../components/MapView.jsx";
import { PROPERTY_TYPES, PRESUPUESTO_OPTIONS, matchesPresupuesto, tipoColor } from "../lib/utils.js";

export default function Home({ navigate }) {
  const { user, isLoggedIn } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState({});
  const [viewMode, setViewMode] = useState("lista"); // lista | mapa

  const [tipo, setTipo] = useState("Ambos");
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

  useEffect(() => {
    if (!isLoggedIn) {
      setFavorites({});
      return;
    }
    supabase
      .from("favorites")
      .select("listing_id")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach((f) => (map[f.listing_id] = true));
        setFavorites(map);
      });
  }, [isLoggedIn, user]);

  const toggleFavorite = useCallback(
    async (id) => {
      if (!isLoggedIn) return navigate("auth");
      if (favorites[id]) {
        setFavorites((f) => ({ ...f, [id]: false }));
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("listing_id", id);
      } else {
        setFavorites((f) => ({ ...f, [id]: true }));
        await supabase.from("favorites").insert({ user_id: user.id, listing_id: id });
      }
    },
    [favorites, isLoggedIn, user, navigate]
  );

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

  const mapPins = useMemo(
    () =>
      filtered
        .filter((l) => l.lat != null && l.lng != null)
        .map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, color: tipoColor(l.tipo_negocio), title: l.titulo })),
    [filtered]
  );

  return (
    <div style={{ background: "var(--color-bg)", minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="container" style={{ padding: "40px 24px 26px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 800, margin: "0 0 6px", letterSpacing: "-0.5px" }}>
            Encuentra tu próximo hogar
          </h1>
          <p style={{ color: "var(--color-muted)", margin: "0 0 22px", fontSize: 15 }}>
            Compra o arrienda inmuebles publicados directamente por personas, asesores y constructoras.
          </p>

          <div style={{ display: "inline-flex", gap: 6, background: "var(--color-surface-soft)", borderRadius: 999, padding: 4, marginBottom: 18 }}>
            {["Venta", "Arriendo", "Ambos"].map((t) => (
              <button key={t} className={`pill-btn ${tipo === t ? "pill-btn-active" : "pill-btn-base"}`} onClick={() => setTipo(t)}>
                {t === "Ambos" ? "Todos" : t}
              </button>
            ))}
          </div>

          <div className="search-pill">
            <div className="search-pill-segment" style={{ flex: 2 }}>
              <label>Buscar</label>
              <input placeholder="Sector, ciudad o título…" value={searchText} onChange={(e) => setSearchText(e.target.value)} />
            </div>
            <div className="search-pill-segment">
              <label>Tipo</label>
              <select value={searchTipoInmueble} onChange={(e) => setSearchTipoInmueble(e.target.value)}>
                {["Todos", ...PROPERTY_TYPES].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div className="search-pill-segment">
              <label>Presupuesto</label>
              <select value={presupuesto} onChange={(e) => setPresupuesto(e.target.value)}>
                {PRESUPUESTO_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <button className="search-pill-btn" onClick={() => {}}>⌕</button>
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: "24px 24px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "var(--color-muted)" }}>
            {loading ? "Cargando inmuebles…" : `${filtered.length} inmueble${filtered.length === 1 ? "" : "s"} encontrado${filtered.length === 1 ? "" : "s"}`}
          </div>
          <div style={{ display: "inline-flex", gap: 4, background: "var(--color-surface-soft)", borderRadius: 999, padding: 4 }}>
            <button className={`pill-btn ${viewMode === "lista" ? "pill-btn-active" : "pill-btn-base"}`} onClick={() => setViewMode("lista")}>Lista</button>
            <button className={`pill-btn ${viewMode === "mapa" ? "pill-btn-active" : "pill-btn-base"}`} onClick={() => setViewMode("mapa")}>Mapa</button>
          </div>
        </div>

        {error && (
          <div className="card" style={{ padding: 16, marginBottom: 16, borderColor: "#e3b6a4", background: "#fdf1ec", color: "#9a3f1f" }}>
            No se pudieron cargar los inmuebles: {error}
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 240 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: "center" }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Todavía no hay inmuebles que coincidan</div>
            <div style={{ color: "var(--color-muted)", fontSize: 14 }}>Ajusta los filtros o sé el primero en publicar un inmueble.</div>
          </div>
        ) : viewMode === "mapa" ? (
          mapPins.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: "center", color: "var(--color-muted)" }}>
              Ninguno de estos inmuebles tiene ubicación marcada todavía.
            </div>
          ) : (
            <MapView mode="multi" pins={mapPins} onSelectPin={(id) => navigate("detail", id)} height={520} />
          )
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20 }}>
            {filtered.map((l) => (
              <PropertyCard
                key={l.id}
                listing={l}
                onOpen={(id) => navigate("detail", id)}
                isFavorite={!!favorites[l.id]}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
