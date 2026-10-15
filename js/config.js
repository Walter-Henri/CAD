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
  deslizamento: { label: 'Deslizamento', shape: 'circle' },
  risco: { label: 'Área de risco, tipo não informado', shape: 'circle' },
  outro: { label: 'Outro risco', shape: 'circle' },
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
// Glifos minimalistas (um por tipo) dentro do selo circular. Forma-base e cor de fundo vêm do CSS; a cor do glifo vem de --glyph.
const RING = '<circle cx="16" cy="16" r="10.6" fill="none" stroke="var(--glyph,#fff)" stroke-opacity=".3"/>';
export const DECOR = {
  inundacao: RING + '<path d="M8.6 12.4q1.9-2.1 3.8 0t3.8 0 3.8 0 3.8 0M8.6 16.6q1.9-2.1 3.8 0t3.8 0 3.8 0 3.8 0M8.6 20.8q1.9-2.1 3.8 0t3.8 0 3.8 0 3.8 0" fill="none" stroke="var(--glyph,#fff)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
  deslizamento: RING + '<path d="M7 22.5l6.6-11.3 4.1 7 2.1-3.2 5 7.5z" fill="var(--glyph,#fff)" stroke="var(--glyph,#fff)" stroke-width="1" stroke-linejoin="round"/><circle cx="23.6" cy="17.4" r="1.3" fill="var(--glyph,#fff)"/><circle cx="26" cy="20.6" r="1.1" fill="var(--glyph,#fff)"/>',
  risco: RING + '<path d="M16 8.6c-3.1 0-5.4 2.3-5.4 5.3 0 3.7 5.4 9.4 5.4 9.4s5.4-5.7 5.4-9.4c0-3-2.3-5.3-5.4-5.3z" fill="none" stroke="var(--glyph,#fff)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="14" r="1.9" fill="var(--glyph,#fff)"/>',
  outro: RING + '<path d="M16 9.4l7.1 12.4H8.9z" fill="none" stroke="var(--glyph,#fff)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 14.6v3.4" fill="none" stroke="var(--glyph,#fff)" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="20.2" r=".9" fill="var(--glyph,#fff)"/>',
};
export const PESO_CALOR = { mAlto: 1, alto: 0.7, medio: 0.4, baixo: 0.3, nd: 0.3 };
export const GRADIENTE_CALOR = { 0.2: '#fde725', 0.4: '#5dc963', 0.6: '#21908d', 0.8: '#3b528b', 1: '#440154' };
