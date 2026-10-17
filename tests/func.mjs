// Execute: cd tests && npm install && npm run test:func
// Testes funcionais e de acessibilidade em Chromium real (axe-core com contraste, teclado, busca, tema, menus).
import chromium from '@sparticuz/chromium'; import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(process.argv[2] || '..'); const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html'; fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'text/plain' }); r.end(d); } }); }).listen(0);
const PORT = srv.address().port, NM = path.resolve('node_modules') + '/';
const LOCAL = { 'leaflet@1.9.4/dist/leaflet.css': NM + 'leaflet/dist/leaflet.css', 'leaflet@1.9.4/dist/leaflet.js': NM + 'leaflet/dist/leaflet.js', 'MarkerCluster.css': NM + 'leaflet.markercluster/dist/MarkerCluster.css', 'leaflet.markercluster.js': NM + 'leaflet.markercluster/dist/leaflet.markercluster.js', 'leaflet-heat.js': NM + 'leaflet.heat/dist/leaflet-heat.js' };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const NOMI = JSON.stringify([{ lat: '-8.12', lon: '-34.94', name: 'Ibura', geojson: { type: 'Polygon', coordinates: [[[-34.96, -8.11], [-34.92, -8.11], [-34.92, -8.14], [-34.96, -8.14], [-34.96, -8.11]]] } }]);
const axe = fs.readFileSync(NM + 'axe-core/axe.min.js', 'utf8');
const browser = await puppeteer.launch({ args: [...chromium.args, '--no-sandbox'], executablePath: await chromium.executablePath(), headless: 'shell' });
const R = []; const ok = (n, c, d = '') => R.push((c ? 'OK     ' : 'FALHA  ') + n + (d ? ' — ' + d : ''));
const novo = async (w, h, touch, dark) => { const p = await browser.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, isMobile: touch, hasTouch: touch });
  if (dark) await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await p.setRequestInterception(true);
  p.on('request', (rq) => { const u = rq.url(); const k = Object.keys(LOCAL).find((x) => u.includes(x)); if (k) return rq.respond({ status: 200, contentType: k.endsWith('css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(LOCAL[k]) });
    if (u.startsWith('http://localhost')) return rq.continue(); if (u.includes('nominatim')) return setTimeout(() => rq.respond({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: NOMI }), 500);
    if (/tile|arcgis|cartocdn/.test(u)) return rq.respond({ status: 200, contentType: 'image/png', body: PNG }); return rq.abort(); });
  p.on('pageerror', (e) => R.push('ERRO JS: ' + e.message));
  await p.evaluateOnNewDocument(() => { try { localStorage.removeItem('riscos_recife_usuario'); } catch (e) { /* */ } });
  await p.goto('http://localhost:' + PORT + '/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 800)); return p; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// --- 1) axe com contraste, 4 combinações
for (const [rot, w, h, touch, dark] of [['celular claro', 390, 844, true, false], ['celular escuro', 390, 844, true, true], ['desktop claro', 1440, 900, false, false], ['desktop escuro', 1440, 900, false, true]]) {
  const p = await novo(w, h, touch, dark); await p.evaluate(axe);
  const estados = [['inicial', async () => {}], ['painel Filtros', async () => { if (touch) await p.click('#bSide'); await wait(400); await p.click('#t-filters'); await wait(200); }], ['painel Indicadores', async () => { await p.click('#t-stats'); await wait(200); }], ['painel Fontes', async () => { await p.click('#t-src'); await wait(200); }]];
  for (const [n, f] of estados) { await f(); const r = await p.evaluate(() => axe.run(document, { rules: { region: { enabled: false } } }).then((x) => x.violations.map((v) => v.id + ' x' + v.nodes.length + ' ' + v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | '))));
    ok('axe ' + rot + ' / ' + n, r.length === 0, r.join('; ')); }
  await p.close();
}
// --- 2) celular: teclado, menus, busca, tema
{ const p = await novo(390, 844, true, false);
  ok('legenda começa recolhida no celular', await p.$eval('#legend', (e) => !e.open));
  ok('painel fechado não é alcançável por Tab (visibility)', await p.$eval('#side', (e) => getComputedStyle(e).visibility === 'hidden'));
  let dentro = 0; for (let i = 0; i < 45; i++) { await p.keyboard.press('Tab'); dentro += await p.evaluate(() => !!document.activeElement.closest('#side')); }
  ok('45 Tabs com painel fechado: foco nunca entra no painel', dentro === 0, dentro + ' vezes');
  await p.click('#bSide'); await wait(450);
  ok('painel abre: botão vira "Fechar painel" e legenda some', (await p.$eval('#bSideT', (e) => e.textContent)) === 'Fechar painel' && await p.$eval('.legend', (e) => getComputedStyle(e).display === 'none'));
  await p.keyboard.press('Escape'); await wait(450);
  ok('Esc fecha o painel e devolve o foco ao botão', await p.evaluate(() => !document.getElementById('side').classList.contains('open') && document.activeElement.id === 'bSide'));
  await p.click('#bMais'); ok('"Mais ações" abre com 4 ações visíveis', await p.$$eval('.tools-more .tool', (a) => a.filter((e) => e.getBoundingClientRect().height > 0).length === 4) && await p.$eval('#bMais', (e) => e.getAttribute('aria-expanded') === 'true'));
  await p.keyboard.press('Escape'); ok('Esc fecha o menu "Mais ações"', await p.$eval('#bMais', (e) => e.getAttribute('aria-expanded') === 'false'));
  await p.click('#bMais'); await p.click('#bReset'); ok('escolher uma ação fecha o menu', await p.$eval('.tools', (e) => !e.classList.contains('open')));
  await p.click('#bMais'); await p.mouse.click(200, 600); ok('clique fora fecha o menu', await p.$eval('.tools', (e) => !e.classList.contains('open')));
  // busca
  await p.type('#q', 'ibura'); await p.keyboard.press('Enter'); await wait(150);
  ok('durante a busca: campo/botão mostram estado ocupado', await p.$eval('#bBuscar', (e) => e.disabled) && (await p.$eval('#bBuscarT', (e) => e.textContent)) === 'Buscando…');
  await wait(900);
  const destaque = await p.$$eval('path.busca', (a) => a.length);
  ok('busca "ibura": contorno de 2 s aparece no mapa', destaque > 0, destaque + ' caminho(s)');
  ok('busca: botão volta ao normal e há aviso', !(await p.$eval('#bBuscar', (e) => e.disabled)) && (await p.$eval('#toast', (e) => e.textContent)).includes('Ibura'));
  await wait(1900); ok('contorno some após ~2 s', (await p.$$eval('path.busca', (a) => a.length)) === 0);
  await p.type('#q', 'Rua Doutor José Rufino, Estância, Recife'); const v = await p.$eval('#q', (e) => ({ w: e.clientWidth, sc: e.scrollWidth, f: getComputedStyle(e).fontSize, h: e.offsetHeight }));
  ok('campo de busca no celular: ≥ 300 px de largura, 16 px, ≥ 44 px de altura', v.w >= 300 && v.f === '16px' && v.h >= 44, JSON.stringify(v));
  // tema
  await p.click('#bTema'); ok('tema alterna para escuro e é salvo', (await p.evaluate(() => document.documentElement.dataset.t)) === 'dark' && (await p.evaluate(() => localStorage.getItem('tema'))) === 'dark');
  await p.close(); }
// --- 3) adicionar ponto + modal no celular com teclado
{ const p = await novo(360, 640, true, false);
  await p.click('#bAdd'); await p.click('#bCenter'); await wait(300);
  ok('formulário abre com foco no campo Local', await p.evaluate(() => document.activeElement.id === 'fTit'));
  await p.keyboard.press('Enter'); ok('Enter vazio mostra o erro (não envia)', await p.$eval('#fErr', (e) => !e.hidden));
  await p.type('#fTit', 'Rua do Teste'); await p.keyboard.press('Enter'); await wait(400);
  ok('Enter com dados salva, fecha o diálogo e mostra os detalhes', await p.evaluate(() => document.getElementById('modal').hidden && !document.getElementById('detail').hidden));
  ok('legenda recolhida enquanto os detalhes estão abertos', await p.$eval('#legend', (e) => !e.open));
  // marcações duplicadas: novo ponto a menos de 15 m de um existente pede confirmação
  let msg = ''; const total = () => p.evaluate(() => JSON.parse(localStorage.getItem('riscos_recife_usuario')).length);
  p.on('dialog', async (d) => { msg = d.message(); await d.dismiss(); });
  await p.click('#dX'); await p.click('#bAdd'); await p.click('#bCenter'); await wait(300); await p.type('#fTit', 'Rua do Teste de novo'); await p.keyboard.press('Enter'); await wait(300);
  ok('ponto repetido a < 15 m pede confirmação; se recusado, não cria duplicata e o formulário continua aberto', msg.includes('Já existe um registro') && (await total()) === 1 && await p.$eval('#modal', (e) => !e.hidden), msg.split('\n')[0]);
  p.removeAllListeners('dialog'); p.on('dialog', (d) => d.accept()); await p.keyboard.press('Enter'); await wait(400);
  ok('se o usuário confirmar, o ponto é criado', (await total()) === 2);
  await p.close(); }
// --- 4) sem marcadores empilhados no mesmo lugar (desktop, modo Individuais, zoom máximo)
{ const p = await novo(1440, 900, false, false);
  await p.click('[data-view=solto]'); await wait(400);
  const icones = () => p.$$eval('#map .leaflet-marker-icon:not(.marker-cluster)', (a) => { const c = {}; a.forEach((e) => { c[e.style.transform] = (c[e.style.transform] || 0) + 1; }); return { n: a.length, empilhados: Object.values(c).filter((v) => v > 1).length }; });
  const ini = await icones(); ok('um ícone por registro visível (339 pontos da Regional Sul + 34 curados)', ini.n === 373, ini.n + ' ícones');
  for (let i = 0; i < 7; i++) { await p.click('.leaflet-control-zoom-in'); await wait(450); }
  const fim = await icones(); ok('no zoom máximo nenhum marcador fica empilhado sobre outro', fim.empilhados === 0 && fim.n === 373, JSON.stringify(fim));
  await p.click('#t-filters'); await p.click('[data-fn=nd]'); await p.click('[data-fn=nd]'); await p.click('#bTema'); await wait(300);
  const dep = await icones(); ok('filtros e tema não geram marcadores a mais', dep.n === 373, dep.n + ' ícones');
  await p.close(); }
await browser.close(); srv.close();
console.log(R.join('\n')); console.log('\nTotal:', R.filter((x) => x.startsWith('OK')).length, 'OK |', R.filter((x) => x.startsWith('FALHA') || x.startsWith('ERRO')).length, 'falhas');
