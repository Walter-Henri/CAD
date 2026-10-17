# Refinamento mobile e responsividade (processo em cascata)

Trabalho conduzido em 6 fases, cada uma com entregável. Todos os números abaixo vêm de execuções reais em Chromium headless 153 (puppeteer-core), com os mapas-base substituídos por imagem neutra e o Nominatim simulado. Os testes estão em `tests/`.

## Fase 1: Levantamento e diagnóstico

**Stack:** HTML, CSS e JavaScript (módulos ES) com Leaflet por CDN. Sem framework, sem build além da injeção da chave CARTO. Um único breakpoint (900 px) em `css/app.css`.

**Método:** medição em 10 larguras (320x568, 360x640, 375x667, 390x844, 412x915, 768x1024, 1024x768, 1440x900 e os celulares deitados 667x375 e 844x390) e 6 estados (inicial, busca digitada, painel aberto, modo adicionar, formulário, detalhes do ponto). As medições checam rolagem horizontal, sobreposição entre controles, controles cortados pela tela, tamanho dos alvos e tamanho do campo de busca.

| # | Problema encontrado (linha de base) | Causa | Prio |
|---|---|---|---|
| D1 | Campo de busca com **26 px** de largura em 320 a 412 px (e 136 px em 667 px) | Cabeçalho fixo de 64 px com marca, busca, botão "Buscar" e dois botões com texto numa linha só | P0 |
| D2 | Botão do painel fora da tela e **não clicável** em 320 e 360 px | Mesma linha do cabeçalho transbordando | P0 |
| D3 | Título "Mapa de Riscos" quebrado em 3 linhas | Falta de espaço no cabeçalho | P1 |
| D4 | Fonte de 14,4 px nos campos | iOS dá zoom automático abaixo de 16 px | P1 |
| D5 | 276 alvos de toque abaixo do mínimo (44 px em toque, 24 px no desktop) e 26 controles cortados | Botões `sm`, chips, abas, linhas de checkbox, zoom do Leaflet | P1 |
| D6 | 54 sobreposições: gaveta do painel sobre legenda e zoom, aviso do modo adicionar sobre as ferramentas em 1024 px, gaveta de detalhes sobre botões | `z-index` iguais e posições absolutas independentes | P1 |
| D7 | Faixa de ações cortada no celular (botão "Mais ações" fora da tela em 320 px) | Faixa horizontal com rolagem | P1 |
| D8 | Painel fechado continuava focável por teclado (medido: em 45 pressões de Tab, o foco entrou nele 17 vezes) | Gaveta só deslocada com `transform` | P1 |
| D9 | Cabeçalho `position: fixed` com altura de 64 px e `inset` fixo no corpo | Número mágico impede cabeçalho de duas linhas | P1 |
| D10 | Áreas seguras (recortes e barras do sistema) ignoradas | `viewport-fit=cover` sem `env(safe-area-inset-*)` | P2 |

**Restrições:** manter eventos, dados, integrações (Nominatim, geolocalização, exportações) e identidade visual. A busca por endereço usa Nominatim, sem autocomplete (não existia e não foi acrescentado).

**Requisitos e critérios de aceitação (verificáveis):**
1. Nenhuma rolagem horizontal da página em nenhuma largura.
2. Zero sobreposições entre controles interativos nos 6 estados e 10 larguras.
3. Zero controles cortados fora da tela (controles dentro de áreas rolantes são exceção).
4. Alvos de toque de pelo menos 44x44 px em telas de toque e 24x24 px no desktop.
5. Campo de busca com largura útil de pelo menos 280 px no celular, fonte de 16 px e altura de pelo menos 44 px.
6. Foco nunca entra em conteúdo escondido; Esc fecha gaveta, menu e detalhes.
7. axe-core sem violações (inclui contraste) em celular e desktop, claro e escuro.
8. Desktop sem regressão visual ou funcional.

## Fase 2: Plano

| Decisão | Ação | Componentes |
|---|---|---|
| Layout raiz | Corpo em coluna flex de altura `100dvh`; cabeçalho no fluxo (não fixo); área do mapa ocupa o restante | `body`, `.nav`, `.app` |
| Cabeçalho mobile | Duas linhas: marca e Tema; busca em largura total com botão de busca embutido no campo (ícone, nome acessível "Buscar") | `.nav`, `.search` |
| Painel mobile | Gaveta inferior com botão fixo "Camadas e filtros"/"Fechar painel", `visibility:hidden` quando fechada, margem direita para não cobrir o zoom | `.side`, `#bSide`, `painel()` |
| Ações mobile | "Adicionar ponto" sempre visível; as outras quatro em menu "Mais ações" (grade de 2 colunas em tela baixa) | `.tools`, `menuAcoes()` |
| Alvos | `min-height: 44px` em botões, chips, abas, linhas e resumos; zoom do Leaflet 44 px em toque | `app.css` |
| Camadas | Novo `--z-sheet` entre sobreposição e modal; legenda recolhida no celular e escondida enquanto a gaveta ou os detalhes ocupam o espaço | tokens, `ui.js` |
| Formulário | Rodapé fixo com os botões (sempre visíveis), campo de busca com fonte de 16 px | `.modal .row-end` |
| Áreas seguras | `env(safe-area-inset-*)` em cabeçalho, gaveta, botão, aviso e detalhes | `app.css` |

**Riscos de regressão:** desktop (tratado com os mesmos testes em 1024 e 1440), foco e teclado (testes de Tab e Esc), busca (teste com resposta simulada).

**Estratégia de testes:** `tests/layout.mjs` (medições de layout, 10 larguras x 6 estados + capturas) e `tests/func.mjs` (axe-core com contraste e fluxos por teclado e toque).

## Fase 3: Implementação

Arquivos alterados: `css/app.css`, `css/tokens.css`, `index.html`, `js/ui.js`, `js/main.js`. Sem mudança em dados, integrações, `map.js`, `search.js` ou exportações. Detalhes em `CHANGELOG.md`.

Defeitos encontrados durante a implementação e corrigidos: abas do painel espremidas a 22 px de altura, botão de busca com 42 px, "Mais ações" cortado em 320 px, menu sob o botão do painel, gaveta de detalhes sobre legenda e zoom, painel de abas em duas linhas em 320 px. A métrica de abas comprimidas foi acrescentada ao teste e confirmada contra o defeito antigo.

## Fase 4: Testes (executados)

**Layout, Chromium real (`tests/layout.mjs`):**

| Métrica | Antes | Depois |
|---|---|---|
| Cenários medidos | 58 | 66 (a versão antiga não tinha o menu "Mais ações" e o painel não abria por toque) |
| Sobreposições | 54 | **0** |
| Controles cortados | 26 | **0** |
| Alvos abaixo do mínimo | 276 | **0** |
| Controles não clicáveis | 6 | **0** |
| Rolagem horizontal | 0 | 0 |
| Erros de JavaScript | 0 | 0 |

Largura do campo de busca (antes → depois): 320 px: 26 → 296; 360 px: 26 → 336; 390 px: 26 → 366; 412 px: 26 → 388; 768 px: 237 → 744; 667x375: 136 → 360. Fonte: 14,4 → 16 px. Altura: 48 px.

**Funcional e acessibilidade, Chromium real (`tests/func.mjs`): 40 verificações, 40 aprovadas (as 5 últimas cobrem marcadores duplicados; veja `CHANGELOG.md`).** Inclui axe-core completo (com contraste) em celular e desktop, tema claro e escuro, nas abas Inicial, Filtros, Indicadores e Fontes (16 execuções, 0 violações). Inclui ainda: 45 pressões de Tab com a gaveta fechada sem o foco entrar nela; Esc fecha gaveta e menu; clique fora fecha o menu; estado "Buscando…"; contorno de busca por 2 s; campo de busca com 364 px, 16 px e 48 px; alternância e persistência do tema; fluxo de adicionar ponto com Enter.

**Verificações estáticas:** sintaxe de todos os módulos JS (`node --check`) e a etapa de build (`scripts/inject-env.mjs`) executadas sem erro. O projeto não tem linter, verificador de tipos nem testes unitários anteriores.

**Inspeção visual:** capturas conferidas por mim em 360x640 (inicial, painel) e 1440x900. As demais foram analisadas por medição, não por olhar uma a uma.

**Defeito do próprio teste corrigido:** o primeiro rodízio apontava `#q × #bBuscar` como sobreposição. É o botão embutido de propósito dentro do campo; a regra passou a ignorar esse par e a gaveta de rodapé do formulário.

## Fase 5: Validação

Critérios 1 a 8 atendidos nos testes acima. Pendências na seção seguinte.

**Pendências e limitações conhecidas**
- **Só Chromium.** Safari/iOS e Firefox não foram testados. As regras `dvh`, `env(safe-area-inset-*)` e `visibility` são padrão, mas não foram vistas nesses motores.
- **Áreas seguras não exercitadas:** o emulador não tem recorte de tela, então `env()` vale zero nos testes.
- **Dispositivos reais, zoom de 200% e 400% e texto ampliado não foram testados.** Leitor de tela (NVDA, VoiceOver, TalkBack) também não.
- **Nominatim real não foi testado** (rede bloqueada no ambiente); a resposta foi simulada. Mapas-base também foram substituídos.
- **Endereço longo:** o campo é de uma linha. Um endereço mais longo que o campo rola dentro dele (por exemplo, 445 px de texto num campo de 364 px). Passar para várias linhas exigiria trocar o campo por área de texto; não foi feito.
- **Cabeçalho do celular ocupa 117 px** (duas linhas), contra 64 px antes. Em 320x568 o mapa fica com 451 px de altura.
- **Autocomplete de endereço não existe** no projeto e não foi acrescentado.
