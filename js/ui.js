// Interface: painel com abas, filtros, indicadores, fontes, legenda e detalhes do registro.
import { TIPOS, NIVEIS, ORIGENS, SHAPES, DECOR } from './config.js';
import { $, esc, num, bairroDe } from './util.js';
export const toast = (m, ruim) => { const t = $('toast'); t.setAttribute('role', ruim ? 'alert' : 'status'); t.textContent = m; t.className = 'toast show' + (ruim ? ' bad' : ''); clearTimeout(toast.h); toast.h = setTimeout(() => { t.className = 'toast'; }, ruim ? 7000 : 3600); };
const ICO_VAZIO = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
const skel = '<div class="skel"></div><div class="skel" style="width:70%"></div><div class="skel" style="width:85%"></div>';
export function abas() {
  const tb = [...document.querySelectorAll('[role=tab]')];
  const sel = (b) => tb.forEach((x) => { const on = x === b; x.setAttribute('aria-selected', on); $(x.getAttribute('aria-controls')).hidden = !on; });
  tb.forEach((b, i) => { b.onclick = () => sel(b); b.onkeydown = (e) => { const j = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : null; if (j !== null) { const n = tb[(j + tb.length) % tb.length]; n.focus(); sel(n); } }; });
  $('bSide').onclick = () => painel(!$('side').classList.contains('open'));
}
export const carregando = () => ['p-stats', 'p-src'].forEach((id) => { $(id).innerHTML = skel; });
const chip = (id, on, txt, extra = '') => '<button class="chip" data-' + extra + '="' + id + '" aria-pressed="' + on + '">' + txt + '</button>';
const LY = [['sul', 'Endereços em área de risco, Regional Sul', 'regional-sul'], ['manchas', 'Manchas derivadas dos endereços', 'manchas'], ['curados', 'Pontos curados', 'curados'],
  ['heat', 'Densidade de endereços, Regional Sul', 'densidade'], ['lona', 'Pontos de lona da Defesa Civil', 'regional-sul'], ['rpa', 'Limites das RPAs', 'rpa'], ['usuario', 'Contribuições da comunidade', null]];
export function painelCamadas(ctx) {
  const f = (id) => ctx.fontes && ctx.fontes.find((x) => x.id === id);
  $('p-layers').innerHTML = '<details class="help"><summary>Como ler este mapa</summary><dl><dt>R1 a R4</dt><dd>Grau de risco da Defesa Civil: R1 baixo, R2 médio, R3 alto, R4 muito alto.</dd><dt>RPA</dt><dd>Região Político-Administrativa: uma das 6 divisões do Recife.</dd><dt>Sedec</dt><dd>Secretaria Executiva de Defesa Civil do Recife.</dd><dt>COP</dt><dd>Centro de Operações do Recife.</dd><dt>Mancha derivada</dt><dd>Contorno calculado por este projeto em torno de endereços oficiais. Não é perímetro oficial.</dd><dt>Densidade</dt><dd>Mostra onde há mais endereços listados. Não mede a intensidade do risco.</dd><dt>Ponto de lona</dt><dd>Local onde a Defesa Civil colocou lona plástica. É uma ação, não uma classificação.</dd><dt>Curadoria</dt><dd>Local transcrito de listas publicadas, com posição aproximada.</dd></dl></details><h2 class="sec">Camadas</h2>' + LY.map(([k, t, fid]) => { const s = f(fid);
    return '<label class="row"><input type="checkbox" data-ly="' + k + '"' + (ctx.layers[k] ? ' checked' : '') + '><span>' + t + '<span class="cap">' + (s ? esc(s.cobertura) + ' · ' + esc(s.referencia) : 'Salvas neste navegador, não verificadas') + '</span></span><span class="n" id="n-' + k + '"></span></label>'; }).join('') +
    '<h2 class="sec" id="h-base">Mapa-base</h2><div class="chips" id="cBase" role="group" aria-labelledby="h-base">' + [['sat', 'Satélite'], ['auto', 'Ruas'], ['relevo', 'Relevo']].map(([i, t]) => chip(i, ctx.base === i, t, 'base')).join('') + '</div>' +
    '<h2 class="sec" id="h-view">Pontos no mapa</h2><div class="chips" id="cView" role="group" aria-labelledby="h-view">' + chip('cluster', ctx.view === 'cluster', 'Agrupados', 'view') + chip('solto', ctx.view === 'solto', 'Individuais', 'view') + '</div>' +
    '<p class="note">Informação de apoio à análise. Não substitui alertas da Defesa Civil (telefone 199) nem avaliação técnica.</p>';
  document.querySelectorAll('[data-ly]').forEach((c) => { c.onchange = () => ctx.aoCamada(c.dataset.ly, c.checked); });
  const grupoChips = (id, attr, fn) => document.querySelectorAll('#' + id + ' .chip').forEach((b) => { b.onclick = () => { document.querySelectorAll('#' + id + ' .chip').forEach((x) => x.setAttribute('aria-pressed', x === b)); fn(b.dataset[attr]); }; });
  grupoChips('cBase', 'base', ctx.aoBase); grupoChips('cView', 'view', ctx.aoView);
}
export function painelFiltros(ctx, lista, todos) {
  const F = ctx.filtros, bairros = [...new Set(todos.map(bairroDe).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt'));
  const cnt = (t) => todos.filter((r) => r.tipo === t).length;
  $('p-filters').innerHTML = '<h2 class="sec">Tipo de risco</h2>' + Object.entries(TIPOS).map(([k, t]) => '<label class="row"><input type="checkbox" data-ft="' + k + '"' + (F.tipos.has(k) ? ' checked' : '') + '><svg width="18" height="18" viewBox="0 0 32 32" aria-hidden="true"><path d="' + SHAPES[t.shape] + '" fill="var(--c-' + ({ inundacao: 'flood', deslizamento: 'slide', risco: 'gen', outro: 'other' })[k] + ')"/>' + DECOR[k] + '</svg><span>' + t.label + '</span><span class="n">' + cnt(k) + '</span></label>').join('') +
    '<h2 class="sec" id="h-nivel">Classificação de risco</h2><div class="chips" role="group" aria-labelledby="h-nivel">' + Object.entries(NIVEIS).map(([k, n]) => chip(k, F.niveis.has(k), n.curto, 'fn')).join('') + '</div><p class="note">R4 muito alto, R3 alto, R2 médio, S/C sem classificação na fonte.</p>' +
    '<h2 class="sec">Origem do dado</h2><div class="fg"><label class="sr" for="fFonte">Origem</label><select id="fFonte"><option value="">Todas</option>' + Object.entries(ORIGENS).map(([k, t]) => '<option value="' + k + '"' + (F.fonte === k ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div>' +
    '<h2 class="sec">Bairro ou localidade</h2><div class="fg"><label class="sr" for="fBairro">Bairro</label><select id="fBairro"><option value="">Todos</option>' + bairros.map((b) => '<option' + (F.bairro === b ? ' selected' : '') + '>' + esc(b) + '</option>').join('') + '</select></div>' +
    '<p class="note">Os arquivos oficiais carregados não trazem data por registro, então não há filtro de período.</p>' +
    (lista.length ? '' : '<div class="empty">' + ICO_VAZIO + '<p>Nenhum registro com esses filtros.</p><button class="btn sm" id="bLimpa">Limpar filtros</button></div>') +
    '<p class="note"><strong>' + num(lista.length) + '</strong> registros visíveis de ' + num(todos.length) + ' nas camadas ativas.</p><button class="btn ghost sm" id="bLimpa2">Limpar filtros</button>';
  document.querySelectorAll('[data-ft]').forEach((c) => { c.onchange = () => ctx.aoFiltro('tipo', c.dataset.ft, c.checked); });
  document.querySelectorAll('[data-fn]').forEach((b) => { b.onclick = () => ctx.aoFiltro('nivel', b.dataset.fn, b.getAttribute('aria-pressed') !== 'true'); });
  $('fFonte').onchange = (e) => ctx.aoFiltro('fonte', e.target.value); $('fBairro').onchange = (e) => ctx.aoFiltro('bairro', e.target.value);
  ['bLimpa', 'bLimpa2'].forEach((i) => { const b = $(i); if (b) b.onclick = ctx.aoLimpar; });
  const n = (F.tipos.size < Object.keys(TIPOS).length) + (F.niveis.size < Object.keys(NIVEIS).length) + !!F.fonte + !!F.bairro;
  $('fBadge').hidden = !n; $('fBadge').textContent = n;
}
const barras = (a) => { const m = Math.max(1, ...a.map((b) => b[1])); return '<div class="bars">' + a.map((b) => '<div><span>' + esc(b[0]) + '</span><i style="width:' + (b[1] / m * 100) + '%"></i><b>' + num(b[1]) + '</b></div>').join('') + '</div>'; };
export function painelIndicadores(d, lista) {
  const t = {}, b = {}; lista.forEach((r) => { t[r.tipo] = (t[r.tipo] || 0) + 1; const k = bairroDe(r) || 'Sem bairro'; b[k] = (b[k] || 0) + 1; });
  const top = (o, n) => Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, n);
  const A = d.atend, C = d.chamados, M = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'], MN = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const mx = A ? Math.max(...A.meses) : 1;
  $('p-stats').innerHTML = '<h2 class="sec">Registros visíveis</h2><div class="kpis"><div class="kpi"><b>' + num(lista.length) + '</b><span>no mapa agora</span></div><div class="kpi"><b>' + num(lista.filter((r) => r.nivel === 'alto' || r.nivel === 'mAlto').length) + '</b><span>em R3 ou R4</span></div></div>' +
    '<h2 class="sec">Por tipo</h2>' + barras(top(Object.fromEntries(Object.entries(t).map(([k, v]) => [TIPOS[k].label, v])), 4)) + '<h2 class="sec">Locais com mais registros</h2>' + barras(top(b, 6)) +
    '<p class="note">Contagens refletem só as fontes ativas e não medem o risco real de cada bairro. Um ponto da Regional Sul pode reunir mais de um endereço.</p>' +
    (A ? '<h2 class="sec">Atendimentos da Defesa Civil em 2024</h2><div class="cols" role="img" aria-label="Atendimentos por mês: ' + A.meses.map((v, i) => MN[i] + ' ' + v).join(', ') + '">' + A.meses.map((v, i) => '<i title="' + MN[i] + ': ' + num(v) + '" style="height:' + Math.max(3, v / mx * 100) + '%"></i>').join('') + '</div><div class="cl">' + M.map((m) => '<span>' + m + '</span>').join('') + '</div>' +
      '<h2 class="sec">Ocorrências registradas</h2>' + barras(A.oc) + '<h2 class="sec">Grau de risco informado</h2>' + barras(A.gr) + '<h2 class="sec">Bairros com mais atendimentos</h2>' + barras(A.bai) +
      '<p class="note">Referência: ' + num(A.n) + ' registros. Cada linha é uma ação da Defesa Civil (monitoramento, lona, vistoria), não um desastre. Só ' + num(A.nOc) + ' trazem a ocorrência e ' + num(A.nGr) + ' o grau de risco. Sem coordenadas, por isso não aparecem no mapa.</p>' : '<div class="empty"><p>Atendimentos 2024 indisponíveis.</p></div>') +
    (C ? '<h2 class="sec">Chamados em ' + C.dia + '</h2>' + barras(Object.entries(C.tipos)) + barras(C.bairros) + '<p class="note">Um único dia (' + C.n + ' chamados). Não forma série histórica nem mede risco.</p>' : '');
}
export function painelFontes(fontes, status) {
  if (!fontes) { $('p-src').innerHTML = '<div class="empty"><p>Não foi possível carregar a lista de fontes.</p></div>'; return; }
  const R = { integrada: 'Integrada', derivada: 'Derivada', curadoria: 'Curadoria', 'nao-integrada': 'Pendente' };
  $('p-src').innerHTML = '<p class="note" style="margin:0 0 12px">Cada camada traz origem, período e limitações. Fontes pendentes não têm dados simulados.</p>' + fontes.map((f) => {
    const L = [['Órgão', f.orgao], ['Referência', f.referencia], ['Baixado em', f.baixadoEm], ['Cobertura', f.cobertura], ['Formato', f.formato], ['Licença', f.licenca], ['Metodologia', f.metodologia], ['Limitações', f.limitacoes]].filter((x) => x[1]);
    return '<details class="src"><summary><span class="st ' + f.status + '">' + R[f.status] + '</span>' + esc(f.nome) + '</summary><dl>' + L.map(([k, v]) => '<dt>' + k + '</dt><dd>' + esc(v) + '</dd>').join('') + (f.url ? '<dt>Link</dt><dd><a href="' + esc(f.url) + '" target="_blank" rel="noopener">Abrir fonte</a></dd>' : '') + '</dl></details>'; }).join('');
}
export function legenda(calorLigado) {
  $('legendBody').innerHTML = '<ul>' + Object.entries(TIPOS).map(([k, t]) => '<li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="' + SHAPES[t.shape] + '" fill="var(--c-' + ({ inundacao: 'flood', deslizamento: 'slide', risco: 'gen', outro: 'other' })[k] + ')" stroke="var(--surface)" stroke-width="2"/>' + DECOR[k] + '</svg>' + t.label + '</li>').join('') +
    '<li><svg viewBox="0 0 32 32" aria-hidden="true"><path d="M5 9c4-5 18-5 22 0v14c-4 5-18 5-22 0z" fill="var(--c-gen)" fill-opacity=".3" stroke="var(--c-gen)" stroke-width="2"/></svg>Mancha derivada (não oficial)</li></ul>' +
    '<p class="note">Classificação: R4 muito alto, R3 alto, R2 médio, S/C sem classificação.</p>' +
    (calorLigado ? '<p class="note" style="margin-bottom:4px">Densidade de endereços listados</p><div class="ramp"></div><div class="small muted" style="display:flex;justify-content:space-between"><span>menor</span><span>maior</span></div>' : '');
}
export function detalhe(r, ctx) {
  const el = $('detail');
  el.innerHTML = '<button class="icon-btn x" id="dX" aria-label="Fechar detalhes"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
    '<span class="tg t-' + r.tipo + '">' + TIPOS[r.tipo].label + '</span><span class="tg lv">' + NIVEIS[r.nivel].label + '</span><h2>' + esc(r.titulo) + '</h2><p class="muted small">' + esc(r.local) + '</p><p style="margin-top:8px;font-size:.9rem">' + esc(r.desc || 'Sem descrição.') + '</p>' +
    '<dl><dt>Origem</dt><dd>' + ORIGENS[r.origem] + '</dd><dt>Fonte</dt><dd>' + esc(r.fonte || 'Contribuição da comunidade, sem verificação') + '</dd><dt>Posição</dt><dd class="mono">' + r.lat.toFixed(5) + ', ' + r.lng.toFixed(5) + (r.aprox ? ' (aproximada)' : '') + '</dd></dl>' +
    '<div class="acts"><button class="btn ghost sm" id="dCopia">Copiar coordenadas</button>' + (r.origem === 'comunidade' ? '<button class="btn ghost sm" id="dDel">Remover ponto</button>' : '') + '</div>';
  el.hidden = false; if (matchMedia('(max-width:900px)').matches) $('legend').open = false; $('dX').onclick = ctx.aoFechar; $('dX').focus();
  $('dCopia').onclick = () => { navigator.clipboard && navigator.clipboard.writeText(r.lat + ', ' + r.lng).then(() => toast('Coordenadas copiadas.'), () => toast('Não foi possível copiar.', true)); };
  if ($('dDel')) $('dDel').onclick = () => ctx.aoRemover(r);
}
export const fechaDetalhe = () => { $('detail').hidden = true; };

let _op = null;
export function abreModal(el, foco, aoEsc) {
  _op = document.activeElement; el.hidden = false;
  document.querySelectorAll('.nav,.app').forEach((n) => n.setAttribute('inert', ''));
  el._trap = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); aoEsc(); return; }
    if (e.key !== 'Tab') return;
    const f = [...el.querySelectorAll('button,input,select,textarea,a[href]')].filter((x) => !x.disabled && !x.closest('[hidden]'));
    const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
  };
  el.addEventListener('keydown', el._trap); foco.focus();
}
export function fechaModal(el = $('modal')) {
  if (el.hidden) return; el.hidden = true; el.removeEventListener('keydown', el._trap);
  document.querySelectorAll('.nav,.app').forEach((n) => n.removeAttribute('inert'));
  (_op && _op !== document.body && _op.isConnected ? _op : $('bAdd')).focus();
}

// Gaveta do painel no celular: abre/fecha, ajusta o rótulo do botão e esconde a legenda enquanto ela estiver coberta.
export function painel(abrir) {
  $('side').classList.toggle('open', abrir); document.body.classList.toggle('sheet-open', abrir);
  $('bSide').setAttribute('aria-expanded', abrir); $('bSideT').textContent = abrir ? 'Fechar painel' : 'Camadas e filtros';
}
// Menu "Mais ações" do celular: fecha ao escolher uma ação, ao clicar fora e com Esc.
export function menuAcoes() {
  const t = document.querySelector('.tools'), b = $('bMais');
  const fecha = (foco) => { t.classList.remove('open'); b.setAttribute('aria-expanded', 'false'); if (foco) b.focus(); };
  b.onclick = () => { const o = t.classList.toggle('open'); b.setAttribute('aria-expanded', o); };
  t.querySelectorAll('.tools-more .tool').forEach((x) => x.addEventListener('click', () => fecha(false)));
  document.addEventListener('click', (e) => { if (t.classList.contains('open') && !t.contains(e.target)) fecha(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && t.classList.contains('open')) { e.stopPropagation(); fecha(true); } }, true);
}
