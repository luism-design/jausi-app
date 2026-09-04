export default function Footer() {
  return (
    <div style={{ borderTop: "1px solid var(--color-border)", marginTop: 40, background: "var(--color-surface-soft)" }}>
      <div className="container" style={{ padding: "32px 24px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Soporte</div>
            {["Centro de ayuda", "Seguridad", "Cancelaciones", "Contáctanos"].map((t) => (
              <div key={t} style={{ fontSize: 12.5, color: "var(--color-muted)", marginBottom: 10 }}>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Comunidad</div>
            {["jausi.co", "Diversidad e inclusión", "Barrios"].map((t) => (
              <div key={t} style={{ fontSize: 12.5, color: "var(--color-muted)", marginBottom: 10 }}>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Publica con Jausi</div>
            {["Publica tu inmueble", "Crea tu perfil de asesor", "Recursos para asesores"].map((t) => (
              <div key={t} style={{ fontSize: 12.5, color: "var(--color-muted)", marginBottom: 10 }}>{t}</div>
            ))}
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 12 }}>Jausi</div>
            {["Cómo funciona", "Nuevas funciones", "Empleo", "Inversionistas"].map((t) => (
              <div key={t} style={{ fontSize: 12.5, color: "var(--color-muted)", marginBottom: 10 }}>{t}</div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: 16, fontSize: 12, color: "var(--color-muted)", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <span>© {new Date().getFullYear()} Jausi, Inc.</span>
            <span>Privacidad</span>
            <span>Términos</span>
            <span>Mapa del sitio</span>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <span>🌐 Español (CO)</span>
            <span>$ COP</span>
          </div>
        </div>
      </div>
    </div>
  );
}
