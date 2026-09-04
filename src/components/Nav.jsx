import { useAuth } from "../lib/AuthContext.jsx";

export default function Nav({ route, navigate, requireAuth }) {
  const { isLoggedIn, profile, user } = useAuth();

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, background: "#fdfdfc", borderBottom: "1px solid var(--color-border)" }}>
      <div className="container" style={{ padding: "14px 24px", display: "flex", alignItems: "center", gap: 24 }}>
        <div onClick={() => navigate("home")} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--color-venta)", letterSpacing: "-0.5px" }}>
            jausi
          </span>
          <span className="hide-mobile" style={{ fontSize: 11, color: "var(--color-muted)" }}>jausi.co</span>
        </div>

        <div style={{ flex: 1 }} />

        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            isLoggedIn ? navigate("advisor", user.id) : requireAuth("advisor", user?.id);
          }}
          style={{ textDecoration: "none", fontSize: 13, fontWeight: 600, color: "var(--color-ink)", whiteSpace: "nowrap" }}
        >
          {isLoggedIn ? profile?.nombre || "Mi perfil" : "Iniciar sesión"}
        </a>

        {isLoggedIn && (
          <a
            href="#"
            className="hide-mobile"
            onClick={(e) => {
              e.preventDefault();
              navigate("crm");
            }}
            style={{ textDecoration: "none", fontSize: 13, fontWeight: 600, color: route.view === "crm" ? "var(--color-venta)" : "var(--color-muted)" }}
          >
            CRM
          </a>
        )}

        <button
          className="btn-primary"
          onClick={() => (isLoggedIn ? navigate("publish") : requireAuth("publish"))}
        >
          Publicar tu inmueble
        </button>
      </div>
    </div>
  );
}
