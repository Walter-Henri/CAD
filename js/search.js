// Busca por coordenadas ("-8.06, -34.88") ou por nome (Nominatim/OpenStreetMap, restrito ao Recife; não é fonte oficial).
// Devolve o centro e, quando o OpenStreetMap tem o contorno do lugar (bairro, por exemplo), o polígono para a demarcação rápida.
import { CFG } from './config.js';
export async function buscar(texto, dentro) {
  const m = texto.match(/^(-?\d+[.,]?\d*)\s*[,;\s]\s*(-?\d+[.,]?\d*)$/);
  if (m) { const ll = [+m[1].replace(',', '.'), +m[2].replace(',', '.')]; if (!dentro(ll)) throw new Error('Coordenadas fora do Recife.'); return { centro: ll, geo: null, nome: 'coordenadas ' + ll[0].toFixed(5) + ', ' + ll[1].toFixed(5) }; }
  const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&bounded=1&polygon_geojson=1&polygon_threshold=0.0003&viewbox=' + CFG.nominatimViewbox + '&q=' + encodeURIComponent(texto + ', Recife');
  let r; try { r = await (await fetch(url)).json(); } catch (e) { throw new Error('A busca está indisponível agora.'); }
  if (!r.length) throw new Error('Nada encontrado no Recife para essa busca.');
  const g = r[0].geojson;
  return { centro: [+r[0].lat, +r[0].lon], geo: g && /Polygon/.test(g.type) ? g : null, nome: r[0].name || texto };
}
