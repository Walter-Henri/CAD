// Execute: cd tests && npm install && npm run test:layout
// Harness de layout: Chromium real, viewports múltiplos, medições objetivas + capturas de tela.
import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.resolve(process.argv[2] || '..'), TAG = process.argv[3] || 'run', ONLY = process.argv[4];
fs.mkdirSync('shots', { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.geojson': 'application/json' };
const srv = http.createServer((q, r) => { let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (f.endsWith('/')) f += 'index.html';
  fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'text/plain' }); r.end(d); } }); }).listen(0);
const PORT = srv.address().port;
const NM = path.resolve('node_modules') + '/';
const LOCAL = { 'leaflet@1.9.4/dist/leaflet.css': NM + 'leaflet/dist/leaflet.css', 'leaflet@1.9.4/dist/leaflet.js': NM + 'leaflet/dist/leaflet.js',
  'leaflet.markercluster@1.5.3/dist/MarkerCluster.css': NM + 'leaflet.markercluster/dist/MarkerCluster.css', 'leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js': NM + 'leaflet.markercluster/dist/leaflet.markercluster.js',
  'leaflet.heat@0.2.0/dist/leaflet-heat.js': NM + 'leaflet.heat/dist/leaflet-heat.js' };
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
const VPS = [['320x568', 320, 568, 2, 1], ['360x640', 360, 640, 3, 1], ['375x667', 375, 667, 2, 1], ['390x844', 390, 844, 3, 1], ['412x915', 412, 915, 2.6, 1], ['768x1024', 768, 1024, 2, 1], ['1024x768', 1024, 768, 1, 0], ['1440x900', 1440, 900, 1, 0], ['667x375 paisagem', 667, 375, 2, 1], ['844x390 paisagem', 844, 390, 3, 1]];
const browser = await puppeteer.launch({ args: [...chromium.args, '--no-sandbox'], executablePath: await chromium.executablePath(), headless: 'shell' });
const out = [];
for (const [nome, w, h, dpr, touch] of VPS) {
  if (ONLY && !nome.startsWith(ONLY)) continue;
  const page = await browser.newPage(); await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr, isMobile: !!touch, hasTouch: !!touch });
  await page.setRequestInterception(true);
  page.on('request', (rq) => { const u = rq.url();
    const k = Object.keys(LOCAL).find((x) => u.includes(x)); if (k) return rq.respond({ status: 200, contentType: k.endsWith('css') ? 'text/css' : 'text/javascript', body: fs.readFileSync(LOCAL[k]) });
    if (u.startsWith('http://localhost')) return rq.continue();
    if (/\.(png|jpg)/.test(u) || /tile|arcgis|cartocdn/.test(u)) return rq.respond({ status: 200, contentType: 'image/png', body: PNG });
    return rq.abort(); });
  const erros = []; page.on('pageerror', (e) => erros.push(String(e.message)));
  await page.evaluateOnNewDocument(() => { try { localStorage.clear(); } catch (e) { /* */ } });
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 900));
  const medir = (estado) => page.evaluate((estado, touch) => {
    const vw = innerWidth, vh = innerHeight, R = [];
    const vis = (e) => { const s = getComputedStyle(e); if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw && !e.closest('[inert]'); };
    const vr = (e) => { let r = e.getBoundingClientRect(), x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom; for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) { const st = getComputedStyle(a); if (/(auto|scroll|hidden)/.test(st.overflow + st.overflowX + st.overflowY)) { const p = a.getBoundingClientRect(); x1 = Math.max(x1, p.left); y1 = Math.max(y1, p.top); x2 = Math.min(x2, p.right); y2 = Math.min(y2, p.bottom); } } return x2 > x1 && y2 > y1 ? { left: x1, top: y1, right: x2, bottom: y2, width: x2 - x1, height: y2 - y1 } : null; };
    const sel = 'button,input:not([type=checkbox]),select,textarea,summary,label.row,[role=tab],.leaflet-control-zoom a,a[href]:not(.leaflet-control-attribution a):not(.skip)';
    const els = [...document.querySelectorAll(sel)].filter(vis).filter((e) => !e.closest('.leaflet-control-attribution') && !e.closest('.leaflet-marker-icon') && !e.closest('.marker-cluster'));
    const rects = els.map((e) => ({ e, r: e.getBoundingClientRect(), v: vr(e), n: (e.id ? '#' + e.id : e.className ? '.' + String(e.className).split(' ')[0] : e.tagName.toLowerCase()) + (e.textContent.trim() ? '"' + e.textContent.trim().slice(0, 18) + '"' : '') }));
    const sobrepoe = []; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], b = rects[j]; if (!a.v || !b.v || a.e.contains(b.e) || b.e.contains(a.e) || (a.e.closest('form.search') && a.e.closest('form.search') === b.e.closest('form.search')) || ((a.e.closest('.modal .row-end') || b.e.closest('.modal .row-end')) && a.e.closest('.modal') === b.e.closest('.modal'))) continue;
      const x = Math.min(a.v.right, b.v.right) - Math.max(a.v.left, b.v.left), y = Math.min(a.v.bottom, b.v.bottom) - Math.max(a.v.top, b.v.top); if (x > 2 && y > 2) sobrepoe.push(a.n + ' x ' + b.n + ' (' + Math.round(x) + 'x' + Math.round(y) + ')'); }
    const cortados = rects.filter(({ v }) => v && (v.left < -1 || v.right > vw + 1 || v.top < -1 || v.bottom > vh + 1)).map(({ n, v: r }) => n + ' [' + Math.round(r.left) + ',' + Math.round(r.top) + ',' + Math.round(r.right) + ',' + Math.round(r.bottom) + ']');
    const min = touch ? 44 : 24; const pequenos = rects.filter(({ r, e, v }) => v && (r.width < min || r.height < min) && !e.closest('.leaflet-control-scale')).map(({ n, r }) => n + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    // contêiner comprimido: filho maior que a própria caixa do pai, nos eixos que não rolam (ex.: abas cortadas)
    const tb = document.querySelector('.tabs'); if (tb && vis(tb)) { const t = tb.getBoundingClientRect(); [...tb.children].forEach((b) => { const r = b.getBoundingClientRect(); if (r.bottom > t.bottom + 1 || b.scrollHeight > b.clientHeight + 1) pequenos.push('ABAS comprimidas: ' + b.id + ' filho ' + Math.round(r.height) + 'px em contêiner ' + Math.round(t.height) + 'px'); }); }
    const truncados = rects.filter(({ e }) => e.matches('button,summary') && e.scrollWidth > e.clientWidth + 1).map(({ n }) => n);
    const q = document.getElementById('q'), qr = q.getBoundingClientRect();
    return { estado, scrollX: document.documentElement.scrollWidth - vw, scrollXbody: document.body.scrollWidth - vw, navAltura: Math.round(document.querySelector('.nav').getBoundingClientRect().height), busca: Math.round(qr.width) + 'x' + Math.round(qr.height) + ' fonte ' + getComputedStyle(q).fontSize,
      sobrepoe, cortados, pequenos, truncados, mapa: Math.round(document.getElementById('map').getBoundingClientRect().height) };
  }, estado, touch);
  const shot = async (n) => page.screenshot({ path: `shots/${TAG}-${nome.replace(/ /g, '_')}-${n}.png` });
  const achados = []; const tap = async (sel) => { try { await page.click(sel); } catch (e) { achados.push('NÃO CLICÁVEL: ' + sel); await page.$eval(sel, (el) => el.click()); } };
  const est = []; est.push(await medir('inicial')); await shot('1-inicial');
  if ((await page.$('#bMais')) && await page.$eval('#bMais', (e) => e.offsetParent !== null)) { await tap('#bMais'); await new Promise((r) => setTimeout(r, 200)); est.push(await medir('menu Mais ações')); await shot('1b-menu'); await tap('#bMais'); }
  const q = await page.$('#q'); await q.click(); await q.type('Rua Doutor José Rufino, Estância, Recife');
  est.push({ ...(await medir('busca digitada')), qScroll: await page.$eval('#q', (e) => e.scrollWidth - e.clientWidth) }); await shot('2-busca'); await page.$eval('#q', (e) => { e.value = ''; });
  const side = await page.$('#bSide'); if (side && await page.$eval('#bSide', (e) => getComputedStyle(e).display !== 'none')) { await tap('#bSide'); await new Promise((r) => setTimeout(r, 450)); est.push(await medir('painel aberto')); await shot('3-painel'); await tap('#bSide'); await new Promise((r) => setTimeout(r, 450)); }
  await tap('#bAdd'); await new Promise((r) => setTimeout(r, 200)); est.push(await medir('modo adicionar')); await shot('4-adicionar');
  await tap('#bCenter'); await new Promise((r) => setTimeout(r, 300)); est.push(await medir('formulário')); await shot('5-formulario');
  await page.type('#fTit', 'Rua do Teste'); await page.evaluate(() => document.getElementById('addForm').requestSubmit()); await new Promise((r) => setTimeout(r, 400));
  est.push(await medir('detalhes do ponto')); await shot('6-detalhes');
  out.push({ nome, erros, est, achados }); await page.close();
}
await browser.close(); srv.close();
fs.writeFileSync(`shots/${TAG}.json`, JSON.stringify(out, null, 1));
for (const v of out) { console.log('\n### ' + v.nome + (v.erros.length ? ' ERROS JS: ' + v.erros : '') + (v.achados.length ? ' | ' + v.achados.join('; ') : ''));
  for (const e of v.est) console.log(`- ${e.estado}: rolagemX=${e.scrollX}/${e.scrollXbody} nav=${e.navAltura}px mapa=${e.mapa}px busca=${e.busca}${e.qScroll !== undefined ? ' textoExcede=' + e.qScroll + 'px' : ''} | sobreposições=${e.sobrepoe.length} cortados=${e.cortados.length} alvos<44=${e.pequenos.length} truncados=${e.truncados.length}`); }
