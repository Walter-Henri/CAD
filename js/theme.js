// Tema claro/escuro: preferência salva, ou o tema do sistema na primeira visita.
const root = document.documentElement;
export const tema = () => root.dataset.t;
export function alternar(depois) {
  root.dataset.t = tema() === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem('tema', root.dataset.t); } catch (e) { /* sem armazenamento */ }
  depois && depois();
}
export function seguirSistema(depois) {
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let salvo = null; try { salvo = localStorage.getItem('tema'); } catch (x) { /* ignora */ }
    if (!salvo) { root.dataset.t = e.matches ? 'dark' : 'light'; depois && depois(); }
  });
}
