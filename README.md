# Mapa de Riscos · Recife

Mapa de apoio à análise de áreas de risco (deslizamentos e alagamentos) do Recife, feito com HTML, CSS e JavaScript puros (módulos ES) e Leaflet. Não precisa de build. É informação de apoio e **não substitui os alertas da Defesa Civil (199)** nem avaliação técnica.

## Estrutura

```
index.html          só a estrutura da página
css/tokens.css      cores, raios, espaços, z-index e tema claro/escuro (mude o visual aqui)
css/app.css         layout e componentes
js/config.js        centro do mapa, tipos, níveis, rótulos
js/env.js           gerado no build com CARTO_API_KEY (não edite)
js/main.js          orquestra estado, eventos e ligação entre as partes
js/data.js          carrega os arquivos de data/ (cada um com status próprio)
js/map.js           tudo do Leaflet: bases, marcadores, camadas, calor
js/ui.js            painel (abas), filtros, indicadores, fontes, legenda, detalhes
js/geo.js           valida se um ponto está no Recife
js/search.js        busca por nome ou coordenadas
js/export.js        exportação CSV e GeoJSON
js/theme.js         alternância entre tema escuro (padrão) e claro
data/               dados já tratados + fontes.json (rastreabilidade)
scripts/build_data.py  regenera data/ a partir dos arquivos baixados do portal
tests/              testes de layout e acessibilidade em Chromium real (dependências próprias)
CHANGELOG.md        histórico de mudanças
docs/               AUDITORIA.md (acessibilidade) e MOBILE-RESPONSIVIDADE.md (layout mobile)
vercel.json         cabeçalhos e cache
```

## Testes

```
cd tests && npm install && npm test
```

`test:dados` confere a integridade dos pontos (sem marcadores duplicados nem endereços perdidos). `test:func` roda axe-core (com contraste) e fluxos por teclado e toque; `test:layout` mede 10 larguras x 6 estados (rolagem horizontal, sobreposição, cortes, alvos de toque, campo de busca) e salva capturas em `tests/shots/`. Os mapas-base e a busca (Nominatim) são simulados.

## Rodar localmente

Os dados são carregados com `fetch`, então abrir o arquivo direto (`file://`) não funciona. Use um servidor local:

```
cp .env.example .env.local   # preencha CARTO_API_KEY
npm run dev                  # gera js/env.js e abre o servidor local
```

## Publicar no Vercel

1. Suba a pasta para um repositório no GitHub.
2. No Vercel: **Add New → Project**, escolha o repositório, **Framework Preset: Other**, deixe build e output em branco.
3. Em **Settings → Environment Variables**, crie `CARTO_API_KEY` com a chave da CARTO (marque Production, Preview e Development) e faça um novo deploy. O build roda `scripts/inject-env.mjs`, que grava a chave em `js/env.js`. Nada de segredo fica no Git.
4. No painel da CARTO, restrinja a chave aos domínios do seu projeto no Vercel. A chave de tiles precisa chegar ao navegador (cada tile é pedido de lá), então a restrição por domínio é a proteção real.

## Como atualizar ou acrescentar coisas

- **Dados oficiais novos:** baixe os arquivos do [portal de dados abertos do Recife](https://dados.recife.pe.gov.br/dataset/defesa-civil) para `raw/` e rode `pip install shapely pyproj && python3 scripts/build_data.py`. Depois atualize as datas em `data/fontes.json`.
- **Nova fonte ou camada:** acrescente uma entrada em `data/fontes.json`, carregue o arquivo em `js/data.js`, desenhe em `js/map.js` e liste a camada em `LY` no `js/ui.js`.
- **Cores e aparência:** `css/tokens.css`. Tipos de risco, níveis e rótulos: `js/config.js`.

## Acessibilidade

Veja `docs/AUDITORIA.md`: problemas encontrados, correções, testes executados e pendências. Nível-alvo: WCAG 2.2 AA, ainda sem validação em dispositivos reais nem com leitor de tela.

## Padrões ao abrir

- **Tema escuro sempre.** A cada carregamento da página o tema é escuro, sem consultar a preferência do sistema nem uma escolha anterior. O usuário pode alternar para o claro, mas a escolha vale só até recarregar e não é salva. O `index.html` fixa o tema antes de a página aparecer, para não piscar.
- **Mapa-base: Satélite.** O painel Camadas oferece Satélite (padrão), Ruas (segue o tema) e Relevo. A escolha também vale só até recarregar.

## Decisões de design (design.md "Heat Map")

- Azul `#0080FF` no foco e nos destaques. O fundo dos botões usa `#0066CC` (mesmo matiz, escurecido) para dar contraste 5,6:1 com texto branco. Vermelho só para erros.
- Tipos de risco com paleta Okabe-Ito e **formas diferentes** (círculo, triângulo, losango, quadrado), então a informação não depende só de cor. Classificações aparecem sempre em texto (R4, R3, R2).
- Sem emojis na interface, sem preto puro, raio de 24 px nos cartões, tipografia do sistema, animações só de `transform` e `opacity`, respeitando `prefers-reduced-motion`.
- Mapa de densidade com escala sequencial perceptualmente uniforme (amarelo claro para roxo escuro, "mais escuro = mais").

## Integridade dos dados

- **Oficial:** endereços da Regional Sul e limites das RPAs, com a classificação original da Defesa Civil.
- **Curadoria:** 34 pontos transcritos de listas oficiais e da imprensa, com posição aproximada.
- **Derivado (análise própria, rotulado no mapa):** manchas de 45 m em torno dos endereços e densidade de endereços. Não são perímetros oficiais nem previsão.
- **Busca:** ao buscar um lugar (por exemplo "Ibura"), o mapa voa até ele e destaca por 2 segundos o contorno do lugar. O contorno vem do OpenStreetMap (Nominatim), **não é perímetro oficial**; para ruas e coordenadas aparecem anéis no ponto.
- **Comunidade:** pontos salvos só no navegador de quem os criou, sempre "não verificados".
- Cada fonte tem órgão, período, licença, metodologia e limitações em `data/fontes.json` (aba **Fontes**).

## Pendências conhecidas

- CEMADEN, ANA, INMET, INPE, SGB/CPRM e Defesa Civil de PE: não integrados (exigem backend e verificação de endpoints). Calor, raios, chuva, níveis de rio e alertas vigentes seguem pendentes; nada foi simulado.
- Só a Regional Sul foi publicada como dado aberto com endereços de risco. Polígonos oficiais (PMRR/SGB) ainda não foram obtidos.
- Atendimentos 2024 e chamados de 29/03/2023 entram só como indicadores agregados (sem coordenadas).
- Testes feitos: sintaxe dos módulos, carregamento dos dados, filtros, tema e regeneração idêntica de `data/` pelo script. Falta testar no navegador real em celular e tablet.
