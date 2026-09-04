import { useState } from "react";

function getYouTubeId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function getVimeoId(url) {
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}

export default function VideoPlayer({ url }) {
  const [playing, setPlaying] = useState(false);
  if (!url) return null;

  const ytId = getYouTubeId(url);
  const vimeoId = getVimeoId(url);

  if (!ytId && !vimeoId) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="btn-secondary" style={{ display: "inline-block" }}>▶ Ver video</a>
    );
  }

  if (playing) {
    const embedSrc = ytId ? `https://www.youtube.com/embed/${ytId}?autoplay=1` : `https://player.vimeo.com/video/${vimeoId}?autoplay=1`;
    return (
      <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <iframe
          src={embedSrc}
          title="Video del inmueble"
          style={{ width: "100%", aspectRatio: "16/9", border: "none", display: "block" }}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setPlaying(true)}
      style={{ position: "relative", height: 220, borderRadius: 14, background: "#111", cursor: "pointer", overflow: "hidden", marginBottom: 20 }}
    >
      {ytId && (
        <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Portada del video" style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} />
      )}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "var(--color-venta)" }}>▶</div>
      </div>
    </div>
  );
}
