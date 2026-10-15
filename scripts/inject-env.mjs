// Gera js/env.js a partir das variáveis de ambiente. Roda no build do Vercel e no `npm run dev`.
// Localmente, lê também .env.local (formato CHAVE=valor). No Vercel, use Settings → Environment Variables.
import fs from 'node:fs';
if (fs.existsSync('.env.local')) {
  for (const l of fs.readFileSync('.env.local', 'utf8').split('\n')) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
const cartoKey = (process.env.CARTO_API_KEY || '').trim();
if (!cartoKey) console.warn('Aviso: CARTO_API_KEY não definida. Os mapas CARTO vão aparecer com marca d\'água "API key required".');
fs.writeFileSync('js/env.js', '// Gerado por scripts/inject-env.mjs. Não edite: o valor vem de CARTO_API_KEY.\nexport const ENV = ' + JSON.stringify({ cartoKey }) + ';\n');
console.log('js/env.js gerado (' + (cartoKey ? 'chave CARTO presente' : 'sem chave CARTO') + ').');
