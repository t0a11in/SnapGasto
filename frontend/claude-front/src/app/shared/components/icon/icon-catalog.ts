import feather from 'feather-icons';

/** Todos los íconos Feather disponibles, ordenados alfabéticamente. */
export const ALL_ICON_NAMES: readonly string[] = Object.keys(feather.icons).sort();

/** Indica si un nombre corresponde a un ícono Feather existente. */
export function isIconName(name: string): boolean {
  return Object.prototype.hasOwnProperty.call(feather.icons, name);
}

export interface AppIcon {
  readonly name: string;
  /** Para qué se usa en SnapGasto. */
  readonly usage: string;
}

/**
 * Íconos con un significado fijo en SnapGasto. Usar siempre el mismo ícono
 * para la misma acción mantiene la interfaz coherente.
 * Las categorías de gasto eligen su propio ícono desde ALL_ICON_NAMES.
 */
export const APP_ICONS: readonly AppIcon[] = [
  { name: 'plus', usage: 'Agregar / crear' },
  { name: 'edit-2', usage: 'Editar' },
  { name: 'trash-2', usage: 'Eliminar' },
  { name: 'x', usage: 'Cerrar / quitar' },
  { name: 'check', usage: 'Confirmar / copiado' },
  { name: 'search', usage: 'Buscar' },
  { name: 'refresh-cw', usage: 'Recargar' },
  { name: 'maximize-2', usage: 'Ver todo' },
  { name: 'chevron-left', usage: 'Anterior' },
  { name: 'chevron-right', usage: 'Siguiente' },
  { name: 'chevron-down', usage: 'Expandir' },
  { name: 'chevron-up', usage: 'Contraer' },
  { name: 'calendar', usage: 'Fechas' },
  { name: 'trending-up', usage: 'Ingresos' },
  { name: 'trending-down', usage: 'Gastos' },
  { name: 'tag', usage: 'Categorías' },
  { name: 'users', usage: 'Usuarios' },
  { name: 'bell', usage: 'Notificaciones' },
  { name: 'list', usage: 'Listados' },
  { name: 'camera', usage: 'Foto de boleta' },
  { name: 'upload-cloud', usage: 'Subir archivos' },
  { name: 'file', usage: 'Archivo' },
  { name: 'file-text', usage: 'Documento / PDF' },
  { name: 'image', usage: 'Imagen' },
  { name: 'eye', usage: 'Mostrar contraseña' },
  { name: 'eye-off', usage: 'Ocultar contraseña' },
  { name: 'alert-circle', usage: 'Error / advertencia' },
  { name: 'help-circle', usage: 'Ayuda' },
  { name: 'menu', usage: 'Menú' },
  { name: 'log-out', usage: 'Cerrar sesión' },
  { name: 'copy', usage: 'Copiar' },
];
