export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'info'
  | 'light'
  | 'dark';

/** solid: relleno · outline: solo borde · ghost: sin fondo ni borde. */
export type ButtonAppearance = 'solid' | 'outline' | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonType = 'button' | 'submit' | 'reset';

/** Clases de Bootstrap para una combinación de variante, apariencia y tamaño. */
export function buttonClasses(variant: ButtonVariant, appearance: ButtonAppearance, size: ButtonSize): string {
  const tone =
    appearance === 'solid'
      ? `btn-${variant}`
      : appearance === 'outline'
        ? `btn-outline-${variant}`
        : `sg-btn-ghost text-${variant === 'light' ? 'body' : variant}`;
  const sizeClass = size === 'sm' ? ' btn-sm' : size === 'lg' ? ' btn-lg' : '';
  return `btn ${tone}${sizeClass}`;
}

/** Tamaño del ícono (px) según el tamaño del botón. */
export function buttonIconSize(size: ButtonSize): number {
  return size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
}
