// Busca por coordenadas ("-8.06, -34.88") ou por nome (Nominatim/OpenStreetMap, restrito ao Recife; não é fonte oficial).
import { CFG } from './config.js';
export async function buscar(texto, dentro) {
  const m = texto.match(/^(-?\d+[.,]?\d*)\s*[,;\s]\s*(-?\d+[.,]?\d*)$/);
  if (m) { const ll = [+m[1].replace(',', '.'), +m[2].replace(',', '.')]; if (!dentro(ll)) throw new Error('Coordenadas fora do Recife.'); return ll; }
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&bounded=1&viewbox=' + CFG.nominatimViewbox + '&q=' + encodeURIComponent(texto + ', Recife');
  let r; try { r = await (await fetch(url)).json(); } catch (e) { throw new Error('A busca está indisponível agora.'); }
  if (!r.length) throw new Error('Nada encontrado no Recife para essa busca.');
  return [+r[0].lat, +r[0].lon];
}
