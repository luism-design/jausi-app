import { useEffect, useState, useCallback } from "react";
import Nav from "./components/Nav.jsx";
import Home from "./views/Home.jsx";
import Detail from "./views/Detail.jsx";
import Advisor from "./views/Advisor.jsx";
import Crm from "./views/Crm.jsx";
import Auth from "./views/Auth.jsx";
import Publish from "./views/Publish.jsx";
import { useAuth } from "./lib/AuthContext.jsx";

function parsePath(pathname) {
  const parts = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean);
  if (parts.length === 0) return { view: "home" };
  if (parts[0] === "inmueble" && parts[1]) return { view: "detail", id: parts[1] };
  if (parts[0] === "asesor" && parts[1]) return { view: "advisor", id: parts[1] };
  if (parts[0] === "crm") return { view: "crm" };
  if (parts[0] === "publicar") return { view: "publish" };
  if (parts[0] === "login") return { view: "auth" };
  return { view: "home" };
}

function pathFor(view, id) {
  if (view === "home") return "/";
  if (view === "detail") return `/inmueble/${id}`;
  if (view === "advisor") return id ? `/asesor/${id}` : "/asesor";
  if (view === "crm") return "/crm";
  if (view === "publish") return "/publicar";
  if (view === "auth") return "/login";
  return "/";
}

export default function App() {
  const { isLoggedIn, user, loading } = useAuth();
  const [route, setRoute] = useState(() => parsePath(window.location.pathname));
  const [pendingView, setPendingView] = useState(null);

  useEffect(() => {
    const onPop = () => setRoute(parsePath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((view, id) => {
    const path = pathFor(view, id);
    window.history.pushState({}, "", path);
    setRoute({ view, id });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const requireAuth = useCallback(
    (view, id) => {
      if (isLoggedIn) navigate(view, id);
      else {
        setPendingView({ view, id });
        navigate("auth");
      }
    },
    [isLoggedIn, navigate]
  );

  const onAuthSuccess = useCallback(() => {
    const target = pendingView || { view: "advisor", id: user?.id };
    setPendingView(null);
    navigate(target.view, target.id);
  }, [pendingView, navigate, user]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#8a7f76" }}>
        Cargando jausi…
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }}>
      <Nav route={route} navigate={navigate} requireAuth={requireAuth} />
      {route.view === "home" && <Home navigate={navigate} />}
      {route.view === "detail" && <Detail id={route.id} navigate={navigate} requireAuth={requireAuth} />}
      {route.view === "advisor" && <Advisor id={route.id} navigate={navigate} requireAuth={requireAuth} />}
      {route.view === "crm" && <Crm navigate={navigate} />}
      {route.view === "publish" && <Publish navigate={navigate} />}
      {route.view === "auth" && <Auth navigate={navigate} onSuccess={onAuthSuccess} />}
    </div>
  );
}
