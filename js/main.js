// Orquestração: estado, eventos e ligação entre dados, mapa e interface.
import { CFG, TIPOS } from './config.js';
import { $ } from './util.js';
import * as tema from './theme.js';
import * as M from './map.js';
import { carregarTudo } from './data.js';
import { dentroDoRecife, distM } from './geo.js';
import { buscar } from './search.js';
import * as X from './export.js';
import * as UI from './ui.js';

const S = { d: null, user: [], layers: { sul: true, manchas: true, curados: true, heat: false, lona: false, rpa: true, usuario: true }, base: 'sat', view: 'cluster',
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
  M.calor(S.layers.heat ? filtrar(S.d.recs.sul).flatMap((r) => Array(r.n || 1).fill(r)) : [], S.layers.heat);
  UI.painelFiltros(ctx, lista, ativos());
  UI.painelIndicadores(S.d, lista);
  UI.legenda(S.layers.heat);
  $('status').textContent = lista.length + ' registros visíveis no mapa.';
  [['sul', S.d.recs.sul.reduce((a, r) => a + (r.n || 1), 0)], ['curados', S.d.recs.curados.length], ['lona', S.d.recs.lona.length], ['usuario', S.user.length]].forEach(([k, n]) => { const e = $('n-' + k); if (e) e.textContent = n; });
}
function escolher(r) { S.foco = document.activeElement; M.destacar(r); UI.detalhe(r, { aoFechar: fechar, aoRemover: remover }); }
function fechar() { UI.fechaDetalhe(); M.destacar(null); if (S.foco && S.foco.isConnected) S.foco.focus(); }
function remover(r) { if (!confirm('Remover "' + r.titulo + '"?\n\nEsta ação não pode ser desfeita.')) return; S.user = S.user.filter((p) => p.id !== r.id); salvar(); fechar(); atualizar(); UI.toast('Ponto removido.'); }
const ctx = { layers: S.layers, base: S.base, view: S.view, filtros: S.filtros, fontes: null,
  aoCamada(k, on) { S.layers[k] = on; if (['rpa', 'manchas', 'lona'].includes(k)) M.camada(k, on); atualizar(); },
  aoBase(b) { S.base = b; M.setBase(b, tema.tema()); }, aoView(v) { S.view = v; atualizar(); },
  aoFiltro(tipo, v, on) { const F = S.filtros; if (tipo === 'tipo') on ? F.tipos.add(v) : F.tipos.delete(v); else if (tipo === 'nivel') on ? F.niveis.add(v) : F.niveis.delete(v); else F[tipo] = v; atualizar(); },
  aoLimpar() { S.filtros.tipos = new Set(['inundacao', 'deslizamento', 'risco', 'outro']); S.filtros.niveis = new Set(['mAlto', 'alto', 'medio', 'baixo', 'nd']); S.filtros.fonte = ''; S.filtros.bairro = ''; ctx.filtros = S.filtros; atualizar(); } };

const NOMES = { fontes: 'lista de fontes', curados: 'pontos curados', sul: 'áreas de risco da Regional Sul', manchas: 'manchas derivadas', rpa: 'limites das RPAs', atend: 'atendimentos 2024', chamados: 'chamados à Defesa Civil' };
async function iniciar() {
  M.initMap(); M.setBase(S.base, tema.tema()); UI.abas(); UI.menuAcoes(); UI.carregando();
  if (matchMedia('(max-width:900px)').matches) $('legend').open = false;
  $('bTema').onclick = () => tema.alternar(() => { M.setBase(S.base, tema.tema()); M.destacar(null); });
  S.d = await carregarTudo(); ctx.fontes = S.d.fontes;
  if (!S.d.rpa) UI.toast('Limites do município indisponíveis: a validação de novos pontos está desligada.', true);
  M.iniciarEstaticas(S.d, escolher);
  ['rpa', 'manchas'].forEach((k) => M.camada(k, S.layers[k]));
  UI.painelCamadas(ctx); UI.painelFontes(S.d.fontes, S.d.status); atualizar();
  const falhas = Object.entries(S.d.status).filter(([, v]) => v !== 'ok');
  if (falhas.length) UI.toast('Não foi possível carregar: ' + falhas.map(([k]) => NOMES[k] || k).join(', ') + '. Recarregue a página para tentar de novo. Os demais dados continuam disponíveis.', true);
  eventos();
}
const sujo = () => ['fTit', 'fBai', 'fDes'].some((i) => $(i).value.trim());
function fimAdd() { S.addMode = false; $('bAdd').setAttribute('aria-pressed', 'false'); $('pill').hidden = true; $('map').style.cursor = ''; UI.fechaModal(); }
function cancelarForm() { if (sujo() && !confirm('Descartar este ponto? O que você digitou será perdido.')) return; fimAdd(); }
function pedirPonto(ll) {
  if (S.d.rpa && !dentro(ll)) return UI.toast('Esse local fica fora do Recife. Mova o mapa ou clique dentro da linha tracejada do município.', true);
  S.tmp = ll; $('fCo').textContent = ll.lat.toFixed(5) + ', ' + ll.lng.toFixed(5);
  ['fTit', 'fBai', 'fDes'].forEach((i) => { $(i).value = ''; $(i).removeAttribute('aria-invalid'); }); $('fErr').hidden = true;
  UI.abreModal($('modal'), $('fTit'), cancelarForm);
}
const exportar = (fn, nome) => { const l = visiveis(); if (!l.length) return UI.toast('Não há registros visíveis para baixar. Ajuste os filtros ou ligue uma camada.', true); fn(l); UI.toast('Baixando ' + l.length + ' registros em ' + nome + '.'); };
function eventos() {
  $('bReset').onclick = () => M.map.flyTo(CFG.center, CFG.zoom);
  $('bCsv').onclick = () => exportar(X.csv, 'CSV'); $('bGeo').onclick = () => exportar(X.geojson, 'GeoJSON');
  $('bLoc').onclick = () => { if (!navigator.geolocation) return UI.toast('Seu navegador não oferece localização. Use a busca para ir a um bairro.', true);
    navigator.geolocation.getCurrentPosition((p) => { const ll = [p.coords.latitude, p.coords.longitude]; M.map.flyTo(ll, 15); L.circleMarker(ll, { radius: 9, color: '#fff', weight: 3, fillColor: '#0066cc', fillOpacity: 1 }).addTo(M.map).bindTooltip('Você está aqui').openTooltip(); },
      (er) => UI.toast(er.code === 1 ? 'Permissão de localização negada. Ative-a nas configurações do navegador ou use a busca.' : 'Não foi possível determinar sua posição. Verifique o GPS e a conexão e tente de novo.', true)); };
  $('searchForm').onsubmit = async (e) => { e.preventDefault(); const v = $('q').value.trim();
    if (!v) { UI.toast('Digite um bairro, uma rua ou coordenadas. Ex.: Nova Descoberta ou -8.06, -34.88.', true); return $('q').focus(); }
    const b = $('bBuscar'); b.disabled = true; $('bBuscarT').textContent = 'Buscando…';
    try { const r = await buscar(v, dentro); M.destacarBusca(r); UI.toast('Mostrando "' + r.nome + '" no mapa' + (r.geo ? ' (contorno do OpenStreetMap, não oficial).' : '.')); } catch (x) { UI.toast(x.message + ' Tente o nome do bairro ou coordenadas como -8.06, -34.88.', true); } finally { b.disabled = false; $('bBuscarT').textContent = 'Buscar'; } };
  $('bAdd').onclick = () => { if (S.addMode) return fimAdd(); UI.painel(false); S.addMode = true; $('bAdd').setAttribute('aria-pressed', 'true'); $('pill').hidden = false; $('map').style.cursor = 'crosshair'; $('bCenter').focus(); };
  $('bCenter').onclick = () => pedirPonto(M.map.getCenter()); $('bCancelAdd').onclick = fimAdd;
  M.map.on('click', (e) => { if (S.addMode) pedirPonto(e.latlng); });
  $('fCan').onclick = cancelarForm;
  $('addForm').onsubmit = (e) => { e.preventDefault(); const t = $('fTit').value.trim();
    if (!t) { $('fErr').hidden = false; $('fTit').setAttribute('aria-invalid', 'true'); $('fTit').focus(); return; }
    const perto = [...S.d.recs.curados, ...S.d.recs.sul, ...S.user].map((r) => [r, distM(r, S.tmp)]).filter(([, d]) => d <= 15).sort((x, y) => x[1] - y[1])[0];
    if (perto && !confirm('Já existe um registro a ' + Math.round(perto[1]) + ' m deste local:\n"' + perto[0].titulo + '" (' + TIPOS[perto[0].tipo].label + ').\n\nRegistrar um novo ponto mesmo assim?')) return $('fTit').focus();
    const rec = { id: 'u' + Date.now(), tipo: $('fTipo').value, titulo: t, local: $('fBai').value.trim(), desc: $('fDes').value.trim(), nivel: $('fNiv').value, lat: S.tmp.lat, lng: S.tmp.lng, origem: 'comunidade', camada: 'usuario' };
    S.user.push(rec); salvar(); S.layers.usuario = true; const cb = document.querySelector('[data-ly=usuario]'); if (cb) cb.checked = true;
    fimAdd(); atualizar(); escolher(rec); UI.toast('Ponto salvo. Ele aparece como "não verificado" e fica só neste navegador.'); };
  $('fTit').addEventListener('input', () => { $('fErr').hidden = true; $('fTit').removeAttribute('aria-invalid'); });
  document.addEventListener('keydown', (e) => { if (e.key !== 'Escape' || !$('modal').hidden) return;
    if (S.addMode) fimAdd(); else if (!$('detail').hidden) fechar();
    else if ($('side').classList.contains('open')) { UI.painel(false); $('bSide').focus(); } });
}
iniciar();
