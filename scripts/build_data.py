#!/usr/bin/env python3
"""Gera os arquivos de data/ a partir dos CSV/GeoJSON baixados do portal de dados abertos do Recife.
Uso: coloque os arquivos baixados em raw/ e rode `python3 scripts/build_data.py [raw] [saida]`.
Requer: pip install shapely pyproj
Os nomes são reconhecidos por trecho: areas-de-risco-da-regional-sul, limites-por-rpa, atendimentos-2024, sedec-solicitacoes."""
import csv, glob, json, math, re, sys, unicodedata, collections as C
from shapely.geometry import shape, Point, mapping
from shapely.ops import unary_union, transform
from pyproj import Transformer

RAW = sys.argv[1] if len(sys.argv) > 1 else 'raw'
OUT = sys.argv[2] if len(sys.argv) > 2 else 'data'
UTM_PARA_GEO = Transformer.from_crs(31985, 4326, always_xy=True).transform
GEO_PARA_UTM = Transformer.from_crs(4326, 31985, always_xy=True).transform
norm_txt = lambda s: unicodedata.normalize('NFKD', s.strip().lower()).encode('ascii', 'ignore').decode()
def limpa(t): return re.sub(r'\s+', ' ', t.replace('\\n', ' ').replace('\n', ' ')).strip()

def achar(trecho):
    r = glob.glob(f'{RAW}/*{trecho}*'); assert r, f'arquivo com "{trecho}" não encontrado em {RAW}/'; return r[0]
def csv_rows(trecho):
    return list(csv.DictReader(open(achar(trecho), encoding='utf8'), delimiter=';'))
def arred(o):
    if isinstance(o, (list, tuple)): return [round(o[0], 5), round(o[1], 5)] if o and isinstance(o[0], (int, float)) else [arred(x) for x in o]
    return o
def salvar(nome, obj): json.dump(obj, open(f'{OUT}/{nome}', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))

# RPAs: reprojeta de SIRGAS 2000 UTM 25S para WGS84 e simplifica em 12 m
NOMES = {1: 'RPA 1 · Centro', 2: 'RPA 2 · Norte', 3: 'RPA 3 · Noroeste', 4: 'RPA 4 · Oeste', 5: 'RPA 5 · Sudoeste', 6: 'RPA 6 · Sul'}
rpa = {'type': 'FeatureCollection', 'features': []}
for f in json.load(open(achar('limites-por-rpa'), encoding='utf8'))['features']:
    g = mapping(transform(UTM_PARA_GEO, shape(f['geometry']).simplify(12))); g['coordinates'] = arred(g['coordinates'])
    rpa['features'].append({'type': 'Feature', 'properties': {'rpa': NOMES[f['properties']['CRPAAACODI']]}, 'geometry': g})
salvar('rpa.geojson', rpa)

# Regional Sul: descarta coordenadas fora do Recife e duplicados exatos
COD = {'Área de Risco Nível 2': '2', 'Área de Risco Nível 3': '3', 'Área de Risco Nível 4': '4', 'Não Informado': 'n', 'Deslizamento': 'd', 'Ponto de Colocação de Lona': 'l'}
pts, vistos = [], set()
for r in csv_rows('areas-de-risco-da-regional-sul'):
    la, ln = float(r['latitude']), float(r['longitude'])
    if not (-8.17 < la < -8.07 and -34.98 < ln < -34.90): print('descartado (fora do Recife):', r['endereco'], la, ln); continue
    k = (round(la, 5), round(ln, 5), r['endereco'].strip().lower())
    if k in vistos: continue
    vistos.add(k); pts.append([round(la, 6), round(ln, 6), r['localidade'].strip(), r['bairro'].strip(), COD[r['descricao']], limpa(r['endereco'])])

# Agrupamento: um marcador por posição. Endereços diferentes na mesma coordenada viram UM ponto com lista de endereços;
# o mesmo endereço numerado repetido a até 15 m (coordenada com pequena variação) conta como duplicata e é descartado.
# Endereços sem número ("s/n") a poucos metros são casas diferentes e não são fundidos.
SEV = {'4': 5, '3': 4, '2': 3, 'd': 2, 'n': 1}
def norm(t): return re.sub(r'\s+', ' ', unicodedata.normalize('NFKD', t.lower()).encode('ascii', 'ignore').decode()).strip(' .,-')
def numerado(t): return bool(re.search(r'\d', t)) and not re.search(r's/?n\b', t.lower())
def dist_m(a, b): return math.hypot((a[0] - b[0]) * 111320, (a[1] - b[1]) * 111320 * math.cos(math.radians(a[0])))
def agrupar(lista):
    grupos, por_pos, lonas, st = [], {}, [], C.Counter()
    for p in lista:
        if p[4] == 'l': lonas.append(p); continue
        g = por_pos.get((p[0], p[1]))
        if g is None:
            g = next((x for x in grupos if x['loc'] == p[2] and numerado(p[5]) and any(norm(a) == norm(p[5]) for a, _ in x['e']) and dist_m((x['la'], x['ln']), p) <= 15), None)
            if g is not None: st['duplicata_a_15m'] += 1
        elif any(norm(a) == norm(p[5]) for a, _ in g['e']): st['duplicata_mesma_posicao'] += 1; continue
        else: st['enderecos_agrupados'] += 1
        if g is None:
            g = {'la': p[0], 'ln': p[1], 'loc': p[2], 'bai': p[3], 'cod': p[4], 'e': [(p[5], p[4])]}; grupos.append(g); por_pos[(p[0], p[1])] = g; continue
        if (p[0], p[1]) in por_pos and g is por_pos[(p[0], p[1])]: g['e'].append((p[5], p[4]))
        if SEV.get(p[4], 0) > SEV.get(g['cod'], 0): g['cod'] = p[4]
    saida = [[g['la'], g['ln'], g['loc'], g['bai'], g['cod'], g['e'][0][0]] + ([[list(x) for x in g['e'][1:]]] if len(g['e']) > 1 else []) for g in grupos]
    print('agrupamento:', len(lista) - len(lonas), 'endereços ->', len(grupos), 'pontos;', dict(st))
    return saida + lonas
salvar('regional-sul.json', agrupar(pts))

# Manchas derivadas: união de círculos de 45 m por localidade (análise própria, não oficial)
por_loc = C.defaultdict(list)
for p in pts:
    if p[4] != 'l': por_loc[(p[3], p[2])].append(p)
man = {'type': 'FeatureCollection', 'features': []}
for (b, l), ps in por_loc.items():
    u = unary_union([Point(*GEO_PARA_UTM(p[1], p[0])).buffer(45) for p in ps]).buffer(12).buffer(-12).simplify(2)
    g = mapping(transform(UTM_PARA_GEO, u)); g['coordinates'] = arred(g['coordinates'])
    man['features'].append({'type': 'Feature', 'properties': {'loc': l, 'bairro': b, 'n': len(ps), 'd': dict(C.Counter(p[4] for p in ps))}, 'geometry': g})
salvar('manchas.geojson', man)

# Atendimentos 2024: indicadores agregados (sem endereços)
rows = csv_rows('atendimentos-2024')
MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
mc = C.Counter(x['Mês'].strip().capitalize() for x in rows)
oc, rot = C.Counter(), {}
for x in rows:
    o = x['Ocorrencia'].strip()
    if o: oc[norm_txt(o)] += 1; rot.setdefault(norm_txt(o), o[0].upper() + o[1:])
gr = C.Counter(x['Grau_de_Risco'].strip().upper() for x in rows if x['Grau_de_Risco'].strip())
ba, rb = C.Counter(norm_txt(x['Bairro']) for x in rows), {}
for x in rows: rb.setdefault(norm_txt(x['Bairro']), x['Bairro'].strip())
AC = {'varzea': 'Várzea', 'agua fria': 'Água Fria'}
salvar('atendimentos-2024.json', {'n': len(rows), 'meses': [mc.get(m, 0) for m in MESES], 'oc': [[rot[k], v] for k, v in oc.most_common(7)], 'nOc': sum(oc.values()),
  'gr': [[k, gr.get(k, 0)] for k in ['R4', 'R3', 'R2', 'R1']], 'nGr': sum(gr.values()), 'bai': [[AC.get(k, rb[k].title()), v] for k, v in ba.most_common(6)], 'd23': sum(1 for x in rows if x['Data'].startswith('2023')),
  'reg': [[k.replace('Planicie', 'Planície'), v] for k, v in C.Counter(norm_txt(x['Regional']).capitalize() for x in rows).most_common(6)]})
print('ok:', len(pts), 'pontos,', len(man['features']), 'manchas,', len(rows), 'atendimentos')
