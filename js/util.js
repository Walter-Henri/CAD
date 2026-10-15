export const $ = (id) => document.getElementById(id);
export const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const num = (n) => Number(n).toLocaleString('pt-BR');
export const bairroDe = (r) => (r.local || '').split('·').pop().trim();
export const cor = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
