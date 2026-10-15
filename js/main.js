// Orquestração: estado, eventos e ligação entre dados, mapa e interface.
import { CFG } from './config.js';
import { $ } from './util.js';
import * as tema from './theme.js';
import * as M from './map.js';
import { carregarTudo } from './data.js';
import { dentroDoRecife } from './geo.js';
import { buscar } from './search.js';
import * as X from './export.js';
import * as UI from './ui.js';

const S = { d: null, user: [], layers: { sul: true, manchas: true, curados: true, heat: false, lona: false, rpa: true, usuario: true }, base: 'auto', view: 'cluster',
  filtros: { tipos: new Set(['inundacao', 'deslizamento', 'risco', 'outro']), niveis: new Set(['mAlto', 'alto', 'medio', 'baixo', 'nd']), fonte: '', bairro: '' }, addMode: false, tmp: null };
try { S.user = JSON.parse(localStorage.getItem(CFG.storeUser) || '[]'); } catch (e) { S.user = []; }
const salvar = () => { try { localStorage.setItem(CFG.storeUser, JSON.stringify(S.user)); } catch (e) { /* sem armazenamento */ } };
const ativos = () => [...(S.layers.curados ? S.d.recs.curados : []), ...(S.layers.sul ? S.d.recs.sul : []), ...(S.layers.usuario ? S.user : [])];
const filtrar = (a, ignoraBairro) => a.filter((r) => S.filtros.tipos.has(r.tipo) && S.filtros.niveis.has(r.nivel) && (!S.filtros.fonte || r.origem === S.filtros.fonte));
const visiveis = () => filtrar(ativos()).filter((r) => !S.filtros.bairro || (r.local || '').split('·').pop().trim() === S.filtros.bairro);
const dentro = (ll) => dentroDoRecife(ll, S.d.rpa);

function atualizar() {
  const lista = visiveis();
  M.marcadores(lista, S.view, escolher);
  M.calor(S.layers.heat ? filtrar(S.d.recs.sul) : [], S.layers.heat);
  UI.painelFiltros(ctx, lista, ativos());
  UI.painelIndicadores(S.d, lista);
  UI.legenda(S.layers.heat);
  [['sul', S.d.recs.sul.length], ['curados', S.d.recs.curados.length], ['lona', S.d.recs.lona.length], ['usuario', S.user.length]].forEach(([k, n]) => { const e = $('n-' + k); if (e) e.textContent = n; });
}
function escolher(r) { M.destacar(r); UI.detalhe(r, { aoFechar: () => { UI.fechaDetalhe(); M.destacar(null); }, aoRemover: remover }); }
function remover(r) { S.user = S.user.filter((p) => p.id !== r.id); salvar(); UI.fechaDetalhe(); M.destacar(null); atualizar(); UI.toast('Ponto removido.'); }
const ctx = { layers: S.layers, base: S.base, view: S.view, filtros: S.filtros, fontes: null,
  aoCamada(k, on) { S.layers[k] = on; if (['rpa', 'manchas', 'lona'].includes(k)) M.camada(k, on); atualizar(); },
  aoBase(b) { S.base = b; M.setBase(b, tema.tema()); }, aoView(v) { S.view = v; atualizar(); },
  aoFiltro(tipo, v, on) { const F = S.filtros; if (tipo === 'tipo') on ? F.tipos.add(v) : F.tipos.delete(v); else if (tipo === 'nivel') on ? F.niveis.add(v) : F.niveis.delete(v); else F[tipo] = v; atualizar(); },
  aoLimpar() { S.filtros.tipos = new Set(['inundacao', 'deslizamento', 'risco', 'outro']); S.filtros.niveis = new Set(['mAlto', 'alto', 'medio', 'baixo', 'nd']); S.filtros.fonte = ''; S.filtros.bairro = ''; ctx.filtros = S.filtros; atualizar(); } };

async function iniciar() {
  M.initMap(); M.setBase('auto', tema.tema()); UI.abas(); UI.carregando();
  $('bTema').onclick = () => tema.alternar(() => { M.setBase(S.base, tema.tema()); M.destacar(null); });
  tema.seguirSistema(() => M.setBase(S.base, tema.tema()));
  S.d = await carregarTudo(); ctx.fontes = S.d.fontes;
  if (!S.d.rpa) UI.toast('Limites do município indisponíveis: a validação de novos pontos está desligada.', true);
  M.iniciarEstaticas(S.d, escolher);
  ['rpa', 'manchas'].forEach((k) => M.camada(k, S.layers[k]));
  UI.painelCamadas(ctx); UI.painelFontes(S.d.fontes, S.d.status); atualizar();
  const falhas = Object.entries(S.d.status).filter(([, v]) => v !== 'ok');
  if (falhas.length) UI.toast('Não carregou: ' + falhas.map(([k]) => k).join(', ') + '. Os demais dados seguem disponíveis.', true);
  eventos();
}
function fimAdd() { S.addMode = false; $('bAdd').classList.remove('on'); $('pill').hidden = true; $('map').style.cursor = ''; $('modal').hidden = true; }
function eventos() {
  $('bReset').onclick = () => M.map.flyTo(CFG.center, CFG.zoom);
  $('bCsv').onclick = () => X.csv(visiveis()); $('bGeo').onclick = () => X.geojson(visiveis());
  $('bLoc').onclick = () => { if (!navigator.geolocation) return UI.toast('Seu navegador não permite localização.', true);
    navigator.geolocation.getCurrentPosition((p) => { const ll = [p.coords.latitude, p.coords.longitude]; M.map.flyTo(ll, 15); L.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: '#0066cc', fillOpacity: 1 }).addTo(M.map).bindTooltip('Você está aqui').openTooltip(); }, () => UI.toast('Não foi possível obter sua localização.', true)); };
  $('searchForm').onsubmit = async (e) => { e.preventDefault(); const v = $('q').value.trim(); if (!v) return;
    try { M.map.flyTo(await buscar(v, dentro), 16); } catch (x) { UI.toast(x.message, true); } };
  $('bAdd').onclick = () => { S.addMode = !S.addMode; $('bAdd').classList.toggle('on', S.addMode); $('pill').hidden = !S.addMode; $('map').style.cursor = S.addMode ? 'crosshair' : ''; };
  M.map.on('click', (e) => { if (!S.addMode) return;
    if (S.d.rpa && !dentro(e.latlng)) return UI.toast('Esse ponto fica fora do limite do Recife.', true);
    S.tmp = e.latlng; $('fCo').textContent = e.latlng.lat.toFixed(5) + ', ' + e.latlng.lng.toFixed(5);
    ['fTit', 'fBai', 'fDes'].forEach((i) => { $(i).value = ''; }); $('fErr').hidden = true; $('modal').hidden = false; $('fTit').focus(); });
  $('fCan').onclick = fimAdd;
  $('modal').addEventListener('keydown', (e) => { if (e.key === 'Escape') fimAdd(); });
  $('addForm').onsubmit = (e) => { e.preventDefault(); const t = $('fTit').value.trim(); if (!t) { $('fErr').hidden = false; $('fTit').focus(); return; }
    S.user.push({ id: 'u' + Date.now(), tipo: $('fTipo').value, titulo: t, local: $('fBai').value.trim(), desc: $('fDes').value.trim(), nivel: $('fNiv').value, lat: S.tmp.lat, lng: S.tmp.lng, origem: 'comunidade', camada: 'usuario' });
    salvar(); fimAdd(); atualizar(); UI.toast('Ponto adicionado. Fica salvo neste navegador.'); };
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('detail').hidden) { UI.fechaDetalhe(); M.destacar(null); } });
}
iniciar();
