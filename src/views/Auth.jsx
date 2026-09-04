import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";

export default function Auth({ onSuccess }) {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login"); // login | register
  const [userType, setUserType] = useState("Persona");
  const [form, setForm] = useState({ nombre: "", email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    if (mode === "login") {
      const { error } = await signIn({ email: form.email, password: form.password });
      setLoading(false);
      if (error) setError(traducirError(error.message));
      else onSuccess();
    } else {
      const { error } = await signUp({ email: form.email, password: form.password, nombre: form.nombre, userType });
      setLoading(false);
      if (error) setError(traducirError(error.message));
      else onSuccess();
    }
  }

  return (
    <div className="container" style={{ padding: "48px 24px", display: "flex", justifyContent: "center" }}>
      <div className="card" style={{ padding: 28, width: "100%", maxWidth: 420 }}>
        <div style={{ display: "flex", gap: 6, background: "var(--color-surface-soft)", borderRadius: 999, padding: 4, marginBottom: 22 }}>
          <button className={`pill-btn ${mode === "login" ? "pill-btn-active" : "pill-btn-base"}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setMode("login")}>
            Iniciar sesión
          </button>
          <button className={`pill-btn ${mode === "register" ? "pill-btn-active" : "pill-btn-base"}`} style={{ flex: 1, justifyContent: "center" }} onClick={() => setMode("register")}>
            Crear cuenta
          </button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && (
            <>
              <div>
                <label className="field-label">Tipo de cuenta</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["Persona", "Asesor", "Constructora"].map((t) => (
                    <button
                      type="button"
                      key={t}
                      className={`chip ${userType === t ? "chip-active" : ""}`}
                      onClick={() => setUserType(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="field-label">{userType === "Constructora" ? "Nombre de la constructora" : "Nombre completo"}</label>
                <input required className="field-input" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
              </div>
            </>
          )}
          <div>
            <label className="field-label">Correo</label>
            <input required type="email" className="field-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <label className="field-label">Contraseña</label>
            <input required type="password" minLength={6} className="field-input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {error && <div style={{ color: "#b3401f", fontSize: 13 }}>{error}</div>}
          <button className="btn-primary" disabled={loading} type="submit">
            {loading ? "Un momento…" : mode === "login" ? "Entrar" : "Crear cuenta"}
          </button>
          {mode === "register" && (
            <p style={{ fontSize: 12, color: "var(--color-muted)", margin: 0 }}>
              Si tu proyecto de Supabase pide confirmación por correo, revisa tu bandeja de entrada antes de poder iniciar sesión.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function traducirError(msg) {
  if (/invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/user already registered/i.test(msg)) return "Ya existe una cuenta con ese correo.";
  if (/password/i.test(msg) && /6/.test(msg)) return "La contraseña debe tener al menos 6 caracteres.";
  return msg;
}
