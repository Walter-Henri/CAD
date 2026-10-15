import { ENV } from './env.js';
// Configuração central. Para trocar a chave CARTO, o centro do mapa ou rótulos, edite só este arquivo.
export const CFG = {
  // A chave CARTO vem da variável de ambiente CARTO_API_KEY (veja js/env.js e scripts/inject-env.mjs).
  cartoKey: ENV.cartoKey,
  center: [-8.05, -34.92], zoom: 12,
  bounds: [[-8.165, -35.02], [-7.93, -34.85]],
  toleranciaGraus: 0.0023, // ~250 m além da linha das RPAs
  storeUser: 'riscos_recife_usuario',
  nominatimViewbox: '-35.02,-7.93,-34.85,-8.165',
};
export const TIPOS = {
  inundacao: { label: 'Inundação e alagamento', shape: 'circle' },
  deslizamento: { label: 'Deslizamento', shape: 'triangle' },
  risco: { label: 'Área de risco, tipo não informado', shape: 'diamond' },
  outro: { label: 'Outro risco', shape: 'square' },
};
export const NIVEIS = {
  mAlto: { label: 'R4 · risco muito alto', short: 'R4' },
  alto: { label: 'R3 · risco alto', short: 'R3' },
  medio: { label: 'R2 · risco médio', short: 'R2' },
  baixo: { label: 'Risco baixo', short: 'Baixo' },
  nd: { label: 'Sem classificação na fonte', short: 'S/C' },
};
export const ORIGENS = { oficial: 'Dado oficial (endereço)', curadoria: 'Curadoria de listas oficiais', comunidade: 'Comunidade (não verificado)' };
export const SHAPES = {
  circle: 'M16 3a13 13 0 1 0 0 26 13 13 0 1 0 0-26z', triangle: 'M16 3 30 28H2z',
  diamond: 'M16 2 30 16 16 30 2 16z', square: 'M5 5h22v22H5z',
};
// Detalhes gráficos dos ícones de inundação (ondas e gota) e deslizamento (encosta, solo e blocos de terra). A forma-base e a cor vêm do CSS.
export const DECOR = {
  inundacao: '<path d="M16 7.2c2 3 3.6 4.9 3.6 6.9a3.6 3.6 0 0 1-7.2 0c0-2 1.6-3.9 3.6-6.9z" fill="#fff"/><path d="M8.6 19.4q1.9-2.1 3.8 0t3.8 0 3.8 0 3.8 0M10 23.6q1.5-1.7 3 0t3 0 3 0 3 0" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  deslizamento: '<path d="M5.2 24.4c4.4-1.8 7.4 1.4 10.8 0s6.4-1.6 10.8 0L27.4 27H4.6z" fill="#4a2b14" fill-opacity=".55"/><path d="M12.4 13.2l4.6 3.4" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/><circle cx="19.6" cy="17.6" r="1.9" fill="#fff"/><circle cx="22.9" cy="21.2" r="1.5" fill="#fff"/><circle cx="17.2" cy="21.6" r="1.2" fill="#fff" fill-opacity=".85"/>',
  risco: '', outro: '',
};
export const PESO_CALOR = { mAlto: 1, alto: 0.7, medio: 0.4, baixo: 0.3, nd: 0.3 };
export const GRADIENTE_CALOR = { 0.2: '#fde725', 0.4: '#5dc963', 0.6: '#21908d', 0.8: '#3b528b', 1: '#440154' };
