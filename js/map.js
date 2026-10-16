// Tudo que toca o Leaflet: mapa, mapas-base, marcadores, camadas estáticas e destaque da seleção.
import { CFG, SHAPES, TIPOS, NIVEIS, PESO_CALOR, GRADIENTE_CALOR, DECOR } from './config.js';
import { esc, cor } from './util.js';
const L = window.L;
export let map;
let bases, baseAtual, grupo, gSel, gHeat;
const estaticas = {};
export function initMap() {
  map = L.map('map', { zoomControl: false, minZoom: 11, maxBounds: L.latLngBounds(CFG.bounds).pad(0.6) }).setView(CFG.center, CFG.zoom);
  L.control.zoom({ position: 'bottomright' }).addTo(map);
  L.control.scale({ imperial: false, position: 'bottomright' }).addTo(map);
  const cc = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';
  const carto = (n) => L.tileLayer('https://basemaps.cartocdn.com/rastertiles/' + n + '/{z}/{x}/{y}{r}.png' + (CFG.cartoKey ? '?key=' + CFG.cartoKey : ''), { maxZoom: 19, attribution: cc });
  bases = { claro: carto('voyager'), escuro: carto('dark_all'),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Imagens &copy; Esri' }),
    relevo: L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', { maxZoom: 17, attribution: '&copy; OpenStreetMap, SRTM | OpenTopoMap' }) };
  return map;
}
export function setBase(sel, tema) {
  const k = sel === 'auto' ? (tema === 'dark' ? 'escuro' : 'claro') : sel;
  if (baseAtual) map.removeLayer(baseAtual);
  baseAtual = bases[k].addTo(map); baseAtual.bringToBack();
}
const icone = (t) => L.divIcon({ className: '', iconSize: [32, 32], iconAnchor: [16, 16],
  html: '<svg class="pin t-' + t + '" width="32" height="32" viewBox="0 0 32 32" aria-hidden="true"><path class="s" d="' + SHAPES[TIPOS[t].shape] + '"/>' + DECOR[t] + '</svg>' });
export function marcadores(lista, modo, aoEscolher) {
  if (grupo) map.removeLayer(grupo);
  grupo = modo === 'cluster' ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 42 }) : L.layerGroup();
  lista.forEach((r) => {
    const m = L.marker([r.lat, r.lng], { icon: icone(r.tipo), alt: r.titulo, keyboard: true });
    m.bindTooltip('<strong>' + esc(r.titulo) + '</strong><br>' + TIPOS[r.tipo].label + ' · ' + NIVEIS[r.nivel].short, { direction: 'top', offset: [0, -12] });
    m.on('add', () => { const e = m.getElement(); if (e && !e._kb) { e._kb = 1; e.setAttribute('aria-label', r.titulo + ', ' + TIPOS[r.tipo].label + ', ' + NIVEIS[r.nivel].label + '. Pressione Enter para abrir os detalhes.'); e.addEventListener('focus', () => m.openTooltip()); e.addEventListener('blur', () => m.closeTooltip()); } });
    m.on('click', () => aoEscolher(r)); grupo.addLayer(m);
  });
  grupo.addTo(map);
}
export function destacar(r) {
  if (gSel) { map.removeLayer(gSel); gSel = null; }
  if (r) gSel = L.circleMarker([r.lat, r.lng], { radius: 22, color: cor('--focus'), weight: 3, fill: false, interactive: false }).addTo(map);
}
export function calor(lista, ligado) {
  if (gHeat) { map.removeLayer(gHeat); gHeat = null; }
  if (!ligado || !lista.length) return;
  gHeat = L.heatLayer(lista.map((r) => [r.lat, r.lng, PESO_CALOR[r.nivel]]), { radius: 28, blur: 24, minOpacity: 0.4, gradient: GRADIENTE_CALOR }).addTo(map);
}
// Camadas estáticas: RPAs, manchas derivadas e pontos de lona.
export function iniciarEstaticas(d, aoEscolher, rotuloMancha) {
  if (d.rpa) estaticas.rpa = L.geoJSON(d.rpa, { style: { className: 'rpa', weight: 2, dashArray: '7 6', fill: false, opacity: 0.8 }, onEachFeature: (f, l) => l.bindTooltip(esc(f.properties.rpa), { sticky: true }) });
  if (d.manchas) estaticas.manchas = L.geoJSON(d.manchas, { style: { className: 'man', weight: 1.5, fillOpacity: 0.25, opacity: 0.9 },
    onEachFeature: (f, l) => { const p = f.properties, k = p.d;
      l.bindTooltip('<strong>' + esc(p.loc) + '</strong><br>Mancha derivada · ' + p.n + ' endereços (R4 ' + (k['4'] || 0) + ', R3 ' + (k['3'] || 0) + ', R2 ' + (k['2'] || 0) + ')<br><em>Análise própria, não é perímetro oficial</em>', { sticky: true }); } });
  estaticas.lona = L.layerGroup(d.recs.lona.map((o) => L.circleMarker([o.lat, o.lng], { radius: 6, color: '#fff', weight: 1.5, fillColor: cor('--c-other'), fillOpacity: 1 })
    .bindTooltip('Ponto de lona · ' + esc(o.titulo)).on('click', () => aoEscolher({ ...o, tipo: 'outro', nivel: 'nd', titulo: 'Ponto de lona · ' + o.titulo }))));
}
export function camada(nome, ligado) { const g = estaticas[nome]; if (!g) return; ligado ? g.addTo(map) : map.removeLayer(g); }
