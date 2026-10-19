# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). O projeto não tem versões nem tags definidas, então as mudanças ficam em "Não lançado". Nenhuma data ou versão histórica foi inventada.

## [Não lançado]

Refinamento mobile, responsividade e padronização de botões e do campo de busca, e correção de marcadores duplicados (17/10/2026). Detalhes do processo e dos testes de layout: `docs/MOBILE-RESPONSIVIDADE.md`.

### Fixed
- **Marcadores duplicados da Regional Sul.** Dos 349 endereços de risco, 9 estavam na mesma coordenada de outro e ficavam empilhados (7 posições com 2 a 3 marcadores, por exemplo "Rua Cafarnaum n 235", "235 A" e "235 B"), e 1 endereço numerado vinha repetido a 8 m ("Rua Cônsul Joseph Noujain n 64"). Agora cada posição tem um único marcador: endereços diferentes na mesma coordenada viram um ponto com a lista nos detalhes ("e mais N"), e a duplicata foi descartada. Resultado: 339 pontos para 348 endereços únicos (nenhum perdido). A classificação do ponto é a mais alta entre os endereços agrupados. Endereços sem número ("s/n") a poucos metros continuam separados, porque são casas diferentes. `scripts/build_data.py`, `data/regional-sul.json`, `js/data.js`.
- **Textos sujos na fonte:** 15 campos traziam `\n` literal e espaços sobrando (por exemplo "Rua Cândido Mendess\n"). A limpeza acontece no script de dados. Erros de grafia da fonte foram mantidos.
- **Novo ponto da comunidade sobre um já existente.** Registrar um ponto a menos de 15 m de outro (curado, oficial ou da comunidade) agora pede confirmação, com o nome e a distância do ponto existente. Se o usuário recusar, o formulário continua aberto e nada é criado. `js/main.js`, `js/geo.js`.
- A densidade de endereços continua contando cada endereço (um ponto agrupado pesa pelo número de endereços), e o contador da camada mostra endereços (348), não pontos. `js/main.js`.
- Exportações CSV e GeoJSON ganharam a coluna/propriedade `enderecos_no_ponto`. `js/export.js`.

- **Campo de busca com 26 px de largura no celular** (320 a 412 px; 136 px em 667x375). A marca, a busca, o botão "Buscar" e dois botões com texto dividiam uma linha. Agora o campo ocupa a largura toda: 296 a 388 px nos celulares, 360 e 537 px nos celulares deitados. Arquivos: `css/app.css`, `index.html`. Verificado em Chromium nas 10 larguras.
- **Botão do painel fora da tela e não clicável** em 320 e 360 px. O botão agora é fixo no rodapé ("Camadas e filtros"). `css/app.css`, `index.html`.
- **54 sobreposições** entre controles, 26 controles cortados e 6 não clicáveis. Eram a gaveta sobre legenda e zoom, o aviso do modo adicionar sobre as ferramentas em 1024 px e a gaveta de detalhes sobre botões. Agora são 0 em 66 cenários (10 larguras, 6 estados).
- **Painel fechado ainda era alcançável por teclado.** Na linha de base o foco entrou nele 17 vezes em 45 pressões de Tab; agora usa `visibility: hidden` e entra 0 vez. `css/app.css`.
- **Título "Mapa de Riscos" quebrado em 3 linhas** no celular. `css/app.css`.
- **Abas do painel cortadas em 22 px de altura** (descoberto durante a implementação). `.tabs` não encolhe mais. `css/app.css`.
- **Rótulo "Baixar planilha (CSV)" quebrava em duas linhas no desktop.** Coluna de ações mais larga e sem quebra. `css/app.css`, `css/tokens.css`.
- **Painéis de abas com área rolável sem foco por teclado** (axe `scrollable-region-focusable`). Cada painel recebeu `tabindex="0"`. `index.html`.

### Changed
- **Tema escuro como padrão fixo.** Antes o tema vinha da escolha salva ou da preferência do sistema. Agora toda carga da página abre no escuro; o botão "Tema" alterna para o claro só até recarregar, e nada é salvo. A preferência do sistema deixou de ser consultada e uma escolha salva em visitas antigas é apagada. O `index.html` aplica o tema antes de exibir a página. `index.html`, `js/theme.js`, `js/main.js`.
- **Satélite como mapa-base inicial.** O painel Camadas passa a listar Satélite, Ruas e Relevo, com Satélite marcado ao abrir. A opção antes chamada "Padrão" foi renomeada para "Ruas" (segue o tema do app), porque "Padrão" deixou de ser o mapa inicial. A escolha vale só até recarregar. `js/main.js`, `js/ui.js`.
- **Cabeçalho do celular em duas linhas** (marca e Tema; busca em largura total) e **no desktop sem mudança**. O cabeçalho deixou de ser fixo com altura de 64 px e passou a ser da coluna flex do corpo (`100dvh`). `css/app.css`.
- **Botão de busca no celular** é um ícone de lupa dentro do campo (nome acessível "Buscar"; texto visível no desktop). Mostra "Buscando…" durante a consulta. `index.html`, `js/main.js`.
- **Ações do mapa no celular:** "Adicionar ponto" fica sempre visível e as outras quatro (Minha localização, Ver Recife inteiro, CSV, GeoJSON) ficam no menu "Mais ações". No desktop continuam todas visíveis. `index.html`, `css/app.css`, `js/ui.js`.
- **Painel no celular** vira gaveta inferior com margem à direita para não cobrir o zoom; no celular deitado vira coluna à esquerda. Abre também com o botão "Camadas e filtros", que vira "Fechar painel". `css/app.css`, `js/ui.js`.
- **Legenda** começa recolhida no celular e some enquanto a gaveta está aberta; abrir os detalhes de um ponto a recolhe. `js/main.js`, `js/ui.js`, `css/app.css`.
- **Detalhes do ponto** no celular ficam acima da legenda e à esquerda do zoom. `css/app.css`.
- **Aviso do modo adicionar** passou a ficar alinhado à esquerda e respeita a coluna de ações (antes colidia em 1024 px). Iniciar o modo fecha a gaveta. `css/app.css`, `js/main.js`.
- **Placeholder da busca** encurtado para "Bairro, rua ou lat, lng". `index.html`.

### Improved
- **Alvos de toque** de pelo menos 44 px em botões, chips, abas, linhas de camada, resumos e no zoom do Leaflet (toque). Antes havia 276 abaixo do mínimo. `css/app.css`.
- **Campos com fonte de 16 px**, que evita o zoom automático do iOS ao focar. `css/app.css`.
- **Formulário de novo ponto** com rodapé fixo (botões sempre visíveis) e `scroll-padding` para o campo focado não ficar sob o rodapé. `css/app.css`.
- **Áreas seguras** (recortes e barras do sistema) respeitadas no cabeçalho, gaveta, botão do painel, aviso e detalhes. `css/app.css`.
- **Menu "Mais ações"** fecha com Esc, com clique fora e ao escolher uma ação, e devolve o foco. `js/ui.js`.

### Technical
- Novo token `--z-sheet` (250) entre sobreposição (200) e modal (300). `css/tokens.css`.
- Funções `painel()` e `menuAcoes()` em `js/ui.js`; `main.js` usa `UI.painel(false)` para o Esc.
- Bloco responsivo único em `css/app.css` (até 900 px), mais uma regra para celular deitado (altura até 500 px), uma para telas até 359 px e uma para toque.
- Sem alteração em `js/map.js`, `js/search.js`, `js/export.js`, `js/data.js`, nos dados ou nas integrações.

### Testing
- **Novo `tests/dados.mjs`:** integridade dos dados (sem posição repetida, sem duplicata numerada a 15 m, nenhum endereço perdido, textos limpos). Reprova os dados anteriores (7 posições repetidas, 1 duplicata) e aprova os atuais (7 de 7).
- **Novo `tests/layout.mjs`:** Chromium real, 10 larguras x 6 estados, mede rolagem horizontal, sobreposição, controles cortados, alvos de toque, abas comprimidas e campo de busca, e salva capturas. Resultado: 66 cenários, 0 violações (linha de base: 54 sobreposições, 26 cortados, 276 alvos pequenos, 6 não clicáveis em 58 cenários).
- **Novo `tests/func.mjs`:** axe-core com contraste (celular e desktop, claro e escuro, 4 abas), foco por teclado, gaveta, menu, busca com resposta simulada, tema e fluxo de adicionar ponto. Resultado: 47 de 47 aprovadas (7 novas cobrem o tema escuro e o Satélite como padrão e a recarga), incluindo 5 verificações novas de marcadores duplicados (um ícone por registro, nenhum empilhado no zoom máximo, confirmação ao registrar ponto a menos de 15 m, filtros e tema sem marcadores a mais).
- Verificação de sintaxe dos módulos e execução do passo de build (`scripts/inject-env.mjs`).
- Execução: `cd tests && npm install && npm test` (roda dados, funcional e layout). Dependências isoladas em `tests/package.json`, que o Vercel não instala.

### Documentation
- `data/fontes.json` (limitações da Regional Sul) atualizado com o agrupamento: 339 pontos para 348 endereços únicos.
- Novo `docs/MOBILE-RESPONSIVIDADE.md` (diagnóstico, plano, testes, validação e pendências).
- Novo `CHANGELOG.md`.
- `README.md` e `docs/AUDITORIA.md` atualizados (estrutura, como rodar os testes e pendências de acessibilidade que mudaram de estado).

### Known Issues
- Testado apenas em Chromium headless. Safari/iOS e Firefox, dispositivos reais, áreas seguras, zoom de 200% e 400%, texto ampliado e leitores de tela continuam sem teste.
- A busca real (Nominatim) e os mapas-base foram simulados nos testes.
- O campo de busca tem uma linha: endereços mais longos que o campo rolam dentro dele.
- O cabeçalho do celular ocupa 117 px (antes 64 px), o que reduz a altura do mapa.
- Autocomplete de endereço não existe no projeto e não foi acrescentado.

## Anteriores (sem versão formal)

Reconstituído a partir da documentação do projeto, sem datas:

- Mapa com dados abertos da Prefeitura do Recife (áreas de risco da Regional Sul, limites das RPAs), manchas derivadas e densidade de endereços, pontos curados e rastreabilidade das fontes (`data/fontes.json`).
- Interface com tema claro e escuro (na época, com escolha salva), painel com abas (Camadas, Filtros, Indicadores, Fontes), legenda, detalhes do registro, busca com contorno de 2 s, exportação CSV e GeoJSON e adição de pontos pela comunidade.
- Chave CARTO por variável de ambiente (`CARTO_API_KEY`), configuração para Vercel e script de geração de dados (`scripts/build_data.py`).
- Auditoria de acessibilidade (`docs/AUDITORIA.md`).
