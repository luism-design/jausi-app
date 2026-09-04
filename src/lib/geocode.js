// Geocodificación gratuita usando Nominatim (OpenStreetMap). No requiere API key.
export async function geocodeAddress(query) {
  if (!query || query.trim().length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=co&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((d) => ({
    label: d.display_name,
    lat: parseFloat(d.lat),
    lng: parseFloat(d.lon),
  }));
}
