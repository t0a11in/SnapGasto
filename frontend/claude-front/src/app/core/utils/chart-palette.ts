/**
 * Paleta categórica validada (orden fijo, nunca cíclico) para el gráfico de torta.
 * Se usan como máximo 6 tonos: con 7 el último (violeta) quedaría junto al primero
 * (azul) al cerrar el círculo y no se distinguen con daltonismo. Las categorías
 * restantes se agrupan en "Otras" con un gris neutro.
 * Validado con dataviz/validate_palette.js (CVD ΔE ≥ 9.1, visión normal ≥ 19.6).
 */
export const CATEGORICAL_PALETTE = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300'] as const;
export const OTHER_COLOR = '#8b8f97';
