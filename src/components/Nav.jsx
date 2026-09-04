import { useAuth } from "../lib/AuthContext.jsx";

export default function Nav({ route, navigate, requireAuth }) {
  const { isLoggedIn, profile, user, signOut } = useAuth();

  return (
    <div style={{ position: "sticky", top: 0, zIndex: 200, background: "#ffffff", borderBottom: "1px solid var(--color-border)" }}>
      <div className="container" style={{ padding: "16px 24px", display: "flex", alignItems: "center", gap: 20 }}>
        <div onClick={() => navigate("home")} style={{ cursor: "pointer", display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 22, color: "var(--color-venta)", letterSpacing: "-0.5px" }}>
            jausi
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <button
          className="btn-secondary hide-mobile"
          onClick={() => (isLoggedIn ? navigate("crm") : requireAuth("crm"))}
          style={{ display: route.view === "crm" ? "none" : "inline-block" }}
        >
          {isLoggedIn ? "Mi CRM" : "Soy asesor"}
        </button>

        <button className="btn-primary" onClick={() => (isLoggedIn ? navigate("publish") : requireAuth("publish"))}>
          Publicar
        </button>

        {isLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="avatar-circle"
              style={{ width: 38, height: 38, fontSize: 14, cursor: "pointer" }}
              onClick={() => navigate("advisor", user.id)}
              title={profile?.nombre}
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                (profile?.nombre || "?").slice(0, 2).toUpperCase()
              )}
            </div>
            <button
              className="hide-mobile"
              onClick={signOut}
              style={{ background: "none", border: "none", fontSize: 12.5, color: "var(--color-muted)", fontWeight: 600 }}
            >
              Salir
            </button>
          </div>
        ) : (
          <button className="btn-secondary" onClick={() => navigate("auth")}>
            Iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
}
