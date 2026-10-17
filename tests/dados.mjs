// Verifica a integridade dos pontos em data/: sem marcadores duplicados e sem perda de endereços.
import fs from 'node:fs'; import path from 'node:path';
const D = path.resolve(process.argv[2] || '..', 'data'); const R = []; const ok = (n, c, d = '') => R.push((c ? 'OK     ' : 'FALHA  ') + n + (d ? ' — ' + d : ''));
const sul = JSON.parse(fs.readFileSync(D + '/regional-sul.json')), cur = JSON.parse(fs.readFileSync(D + '/pontos-curados.json'));
const risco = sul.filter((r) => r[4] !== 'l'), lona = sul.filter((r) => r[4] === 'l');
const dist = (a, b) => Math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * Math.cos(a[0] * Math.PI / 180));
const norm = (t) => t.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const chave = (r) => r[0].toFixed(6) + ',' + r[1].toFixed(6);
const pos = new Map(); risco.forEach((r) => pos.set(chave(r), (pos.get(chave(r)) || 0) + 1));
ok('nenhuma posição repetida entre pontos de risco', [...pos.values()].every((v) => v === 1), 'repetidas: ' + [...pos.values()].filter((v) => v > 1).length);
let dup = 0; for (let i = 0; i < risco.length; i++) for (let j = i + 1; j < risco.length; j++) { const a = risco[i], b = risco[j]; if (a[2] === b[2] && /\d/.test(a[5]) && !/s\/?n\b/i.test(a[5]) && norm(a[5]) === norm(b[5]) && dist(a, b) <= 15) dup++; }
ok('nenhum endereço numerado repetido a até 15 m', dup === 0, 'duplicatas: ' + dup);
const enderecos = risco.reduce((s, r) => s + 1 + (r[6] ? r[6].length : 0), 0);
ok('nenhum endereço perdido no agrupamento (339 pontos reúnem 348 endereços únicos)', risco.length === 339 && enderecos === 348, risco.length + ' pontos, ' + enderecos + ' endereços');
ok('nenhum texto com "\\n" literal ou espaços sobrando', sul.every((r) => [r[2], r[3], r[5], ...(r[6] || []).map((e) => e[0])].every((t) => !/\\n|\n/.test(t) && t === t.trim() && !/\s{2,}/.test(t))));
const lp = new Map(); lona.forEach((r) => lp.set(chave(r), 1)); ok('pontos de lona sem posição repetida', lp.size === lona.length);
const cp = new Set(cur.map((c) => c.lat.toFixed(5) + ',' + c.lng.toFixed(5))); ok('pontos curados sem posição repetida', cp.size === cur.length);
ok('pontos curados sem título repetido', new Set(cur.map((c) => norm(c.titulo))).size === cur.length);
console.log(R.join('\n')); if (R.some((x) => x.startsWith('FALHA'))) process.exit(1);
