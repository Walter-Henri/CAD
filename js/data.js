// Carregamento dos arquivos de data/. Cada fonte tem status próprio, então uma falha não derruba o mapa.
const ARQUIVOS = {
  fontes: 'data/fontes.json', curados: 'data/pontos-curados.json', sul: 'data/regional-sul.json',
  manchas: 'data/manchas.geojson', rpa: 'data/rpa.geojson', atend: 'data/atendimentos-2024.json', chamados: 'data/chamados-2023-03-29.json',
};
const CD = { 2: 'Área de Risco Nível 2', 3: 'Área de Risco Nível 3', 4: 'Área de Risco Nível 4', n: 'Classificação não informada na fonte', d: 'Registro de deslizamento' };
export async function carregarTudo() {
  const chaves = Object.keys(ARQUIVOS);
  const res = await Promise.allSettled(chaves.map((k) => fetch(ARQUIVOS[k]).then((r) => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })));
  const d = { status: {} };
  chaves.forEach((k, i) => { const ok = res[i].status === 'fulfilled'; d[k] = ok ? res[i].value : null; d.status[k] = ok ? 'ok' : String(res[i].reason && res[i].reason.message || 'falha'); });
  const fsul = d.fontes && d.fontes.find((f) => f.id === 'regional-sul');
  const rotulo = fsul ? fsul.orgao + ' · ' + fsul.nome + ' (' + fsul.referencia + ')' : 'Prefeitura do Recife, Defesa Civil';
  d.recs = { curados: [], sul: [], lona: [] };
  (d.curados || []).forEach((r) => d.recs.curados.push({ ...r, origem: 'curadoria', camada: 'curados' }));
  (d.sul || []).forEach((r, i) => {
    const o = { id: 's' + i, lat: r[0], lng: r[1], local: 'Regional Sul · ' + r[3] + ' · ' + r[2], origem: 'oficial', fonte: rotulo, titulo: r[5], camada: 'sul', desc: CD[r[4]] };
    if (r[4] === 'l') { o.desc = 'Ponto de colocação de lona (ação da Defesa Civil, não é classificação de risco).'; d.recs.lona.push(o); return; }
    o.tipo = r[4] === 'd' ? 'deslizamento' : 'risco';
    o.nivel = { 2: 'medio', 3: 'alto', 4: 'mAlto' }[r[4]] || 'nd';
    o.desc = r[4] === 'd' ? CD.d + ' (fonte).' : CD[r[4]] + '. O tipo de risco não é informado pela fonte.';
    d.recs.sul.push(o);
  });
  return d;
}
