// Exportação dos registros visíveis. Respeita a licença da fonte: mantém o campo "fonte" em cada linha.
function baixar(nome, texto, mime) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([texto], { type: mime })); a.download = nome; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
export function geojson(list) {
  baixar('riscos-recife.geojson', JSON.stringify({ type: 'FeatureCollection', features: list.map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
    properties: { titulo: p.titulo, tipo: p.tipo, classificacao: p.nivel, local: p.local, descricao: p.desc, origem: p.origem, fonte: p.fonte || 'comunidade', posicao_aproximada: !!p.aprox } })) }, null, 1), 'application/geo+json');
}
export function csv(list) {
  const q = (s) => '"' + String(s == null ? '' : s).replace(/"/g, '""') + '"';
  baixar('riscos-recife.csv', '\ufefftitulo,tipo,classificacao,local,descricao,origem,fonte,lat,lng\n' + list.map((p) => [p.titulo, p.tipo, p.nivel, p.local, p.desc, p.origem, p.fonte || 'comunidade', p.lat, p.lng].map(q).join(',')).join('\n'), 'text/csv');
}
