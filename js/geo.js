// Verifica se um ponto está dentro do município (RPAs), com tolerância pequena na borda.
import { CFG } from './config.js';
const dseg = (x, y, a, b) => {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy;
  const t = l ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l)) : 0;
  return Math.hypot(x - (a[0] + t * dx), y - (a[1] + t * dy));
};
export function dentroDoRecife(ll, rpa) {
  const y = ll.lat !== undefined ? ll.lat : ll[0], x = ll.lng !== undefined ? ll.lng : ll[1];
  return rpa.features.some((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).some((p) => {
    const r = p[0]; let c = false, m = 1;
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const a = r[i], b = r[j];
      if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) c = !c;
      m = Math.min(m, dseg(x, y, a, b));
    }
    return c || m < CFG.toleranciaGraus;
  }));
}

// Distância aproximada em metros entre dois pontos ({lat,lng} ou [lat,lng]).
export const distM = (a, b) => {
  const la = a.lat !== undefined ? a.lat : a[0], lo = a.lng !== undefined ? a.lng : a[1], lb = b.lat !== undefined ? b.lat : b[0], ob = b.lng !== undefined ? b.lng : b[1];
  return Math.hypot((la - lb) * 111320, (lo - ob) * 111320 * Math.cos(la * Math.PI / 180));
};
