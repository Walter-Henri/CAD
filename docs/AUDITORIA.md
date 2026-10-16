# Auditoria de UX/UI e acessibilidade

Escopo: interface do mapa (cabeçalho, painel com 4 abas, mapa, ferramentas, legenda, detalhes, formulário de novo ponto). Meta: WCAG 2.2 nível AA, sem alterar dados, regras ou integrações.

## Problemas encontrados e correções

| Prio | Problema | Impacto | Correção | Verificação |
|---|---|---|---|---|
| P0 | Adicionar ponto só funcionava com clique do mouse | Quem usa teclado ou leitor de tela não conseguia contribuir (WCAG 2.1.1) | Botão "Marcar no centro do mapa" no aviso do modo adicionar; o foco vai direto para ele | Teste de teclado automatizado |
| P0 | Diálogo sem foco preso, sem foco de volta e com fundo ainda navegável | Foco escapava para trás do diálogo (WCAG 2.4.3) | Foco preso (Tab e Shift+Tab), fundo `inert`, foco devolvido ao abrir/fechar, Esc fecha | Teste de teclado |
| P0 | Contraste insuficiente em etiquetas de texto (Deslizamento 3,87:1, Outro 3,61:1) e bordas de campos (1,3:1) | Texto e campos difíceis de ver (WCAG 1.4.3 e 1.4.11) | Tokens `--c-slide-text`, `--c-other-text` e `--line-strong` (bordas de 3,5 a 4,3:1) | Cálculo dos 50 pares de cores: 0 falhas |
| P1 | Botões de ação só com ícone (dependiam de `title`) | Finalidade incerta para iniciantes e em toque | Todas as ações têm texto visível ("Baixar planilha (CSV)", "Ver Recife inteiro"); tema e painel também | axe + checagem de nomes |
| P1 | Sem `h1`; títulos do painel em `h3` sem `h2` | Navegação por títulos quebrada em leitores de tela | `h1` único, seções em `h2` | Teste de estrutura |
| P1 | Siglas sem explicação (R2, R3, R4, RPA, Sedec, COP, S/C) | Termos técnicos incompreensíveis | "Como ler este mapa" (glossário recolhível) e filtros com texto ("R4 muito alto", "Sem classificação") | Revisão de texto |
| P1 | Pontos do mapa sem nome acessível nem dica ao focar com teclado | Leitor de tela anunciava "botão" sem contexto | `aria-label` com nome, tipo e nível; dica abre ao focar | Código revisado, falta teste em leitor real |
| P1 | Remover ponto e fechar o formulário preenchido sem confirmação | Perda de dados por clique acidental | Confirmação nas duas ações | Teste de fluxo |
| P1 | Erros genéricos (localização, busca, carga de dados, exportação) | Usuário não sabia o que fazer | Mensagens com causa e próximo passo; erros ficam 7 s e usam `role="alert"` | Revisão de texto |
| P2 | Formulário sem exemplos, erro sem associação ao campo | Preenchimento difícil (WCAG 3.3.1, 3.3.2) | Exemplos, "(obrigatório)", `aria-describedby`, `aria-invalid`, erro com foco no campo | axe + teste de fluxo |
| P2 | Ponto salvo podia ficar invisível (camada desligada) | Parecia que o salvamento falhou | A camada "Contribuições" liga sozinha e os detalhes do ponto abrem | Teste de fluxo |
| P2 | Mudança de filtros sem aviso a leitores de tela | Resultado dos filtros não era percebido | Região `aria-live` com a contagem de registros | Teste de fluxo |
| P2 | Fontes de 8 a 10 px (rótulos de gráfico, selos) | Leitura difícil | Mínimo de 12 px (`--fs-xs`) | Busca no CSS |
| P2 | Ferramentas e painel no celular | Controles sem texto e sobrepostos | Ferramentas viram faixa horizontal com rótulos; botão "Painel" com texto; Esc fecha o painel | **Não testado em tela real** |
| P3 | Resumo de filtros em chips sem agrupamento | Grupos sem nome | `role="group"` com título associado | axe |

## O que já funcionava e foi preservado
Tema claro/escuro com preferência salva, skip link, rótulos persistentes, tamanho de alvo de 44 px nos botões, `prefers-reduced-motion`, legenda sempre visível, estados de carregamento, vazio e falha por fonte, aba Fontes com rastreabilidade.

## Verificações executadas
- 50 pares de cor (claro e escuro) contra WCAG 1.4.3 e 1.4.11: 0 falhas.
- axe-core 4.x em 2 estados (diálogo aberto e estado final): 0 violações. A regra de contraste do axe não roda em jsdom, por isso o contraste foi calculado à parte.
- 20 verificações de fluxo (abas por teclado, adicionar por teclado, foco preso, validação, salvar, remover, Esc, filtros vazios, exportação, estrutura de títulos, nomes acessíveis).
- Sintaxe de todos os módulos JS.

## Limitações e pendências
- **Sem teste em navegador real, celular ou tablet.** Layout, quebras e a faixa de ferramentas no celular foram escritos, não vistos. (P1 a validar)
- **Sem teste com leitor de tela** (NVDA, VoiceOver, TalkBack). Nomes e regiões foram verificados só por ferramenta automática. (P1)
- **Zoom de 200% e 400%** e texto ampliado não foram testados. (P1)
- Os controles internos do Leaflet (zoom, atribuição) usam o tema do app, mas não foram auditados.
- Confirmações usam `confirm()` do navegador: acessível, mas visualmente fora do padrão. (P3)
- Os gráficos são descritos por `aria-label` e texto. Uma tabela alternativa seria melhor. (P2)
- Não há como afirmar conformidade total com WCAG 2.2 AA sem os testes acima.

## Próxima etapa sugerida
1. Testes manuais em celular, tablet e desktop (Chrome, Safari, Firefox) e com leitor de tela.
2. Trocar `confirm()` por um diálogo próprio.
3. Tabela alternativa para os gráficos.
4. Medir desempenho de carregamento no celular (os dados somam cerca de 100 KB).
