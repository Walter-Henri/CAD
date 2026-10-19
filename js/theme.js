// Tema: o escuro é sempre o padrão a cada carregamento da página. O usuário pode alternar para o claro,
// mas a escolha vale só até recarregar: nada é salvo e a preferência do sistema não é consultada.
const root = document.documentElement;
export const tema = () => root.dataset.t;
export function alternar(depois) {
  root.dataset.t = tema() === 'dark' ? 'light' : 'dark';
  depois && depois();
}
