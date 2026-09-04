export function slugify(str = "") {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function fmtCOP(n) {
  const num = Number(n) || 0;
  if (num >= 1000000000) return "$" + (num / 1000000000).toFixed(2).replace(/\.00$/, "") + " mil M";
  if (num >= 1000000) return "$" + Math.round(num / 1000000) + "M";
  return "$" + num.toLocaleString("es-CO");
}

export const VENTA_COLOR = "#DC5A2E";
export const ARRIENDO_COLOR = "#4C6FDC";

export function tipoColor(tipoNegocio) {
  return tipoNegocio === "Arriendo" ? ARRIENDO_COLOR : VENTA_COLOR;
}

export const PROPERTY_TYPES = ["Casa", "Apartamento", "Bodega", "Local", "Lote"];

export const SPECS_BY_TYPE = {
  Casa: ["Garaje", "Jardín privado", "Piscina", "Terraza", "Estudio", "2 pisos o más", "Zona de BBQ", "Depósito"],
  Apartamento: ["Ascensor", "Balcón", "Parqueadero", "Depósito", "Administración incluida", "Amoblado", "Vista exterior", "Zona social"],
  Bodega: ["Muelle de carga", "Altura libre +6m", "Energía trifásica", "Oficinas internas", "Parqueadero de camiones", "Cámaras de seguridad", "Piso industrial"],
  Local: ["Frente comercial", "Esquinero", "Baño propio", "Aire acondicionado", "Uso mixto", "Vitrina", "Bodega interna"],
  Lote: ["Topografía plana", "Esquinero", "Servicios disponibles", "Uso residencial", "Uso comercial", "Vía pavimentada"],
};

export const AMENITY_CHIPS = ["Parqueadero", "Amoblado", "Piscina", "Gimnasio", "Terraza", "Zona infantil"];

export const PRESUPUESTO_OPTIONS = ["Todos", "Hasta $300M", "$300M - $600M", "$600M - $1.000M", "Más de $1.000M"];

export function matchesPresupuesto(precio, opcion) {
  if (opcion === "Todos") return true;
  if (opcion === "Hasta $300M") return precio <= 300000000;
  if (opcion === "$300M - $600M") return precio > 300000000 && precio <= 600000000;
  if (opcion === "$600M - $1.000M") return precio > 600000000 && precio <= 1000000000;
  if (opcion === "Más de $1.000M") return precio > 1000000000;
  return true;
}
