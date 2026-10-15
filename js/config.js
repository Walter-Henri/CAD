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
export const PESO_CALOR = { mAlto: 1, alto: 0.7, medio: 0.4, baixo: 0.3, nd: 0.3 };
export const GRADIENTE_CALOR = { 0.2: '#fde725', 0.4: '#5dc963', 0.6: '#21908d', 0.8: '#3b528b', 1: '#440154' };
