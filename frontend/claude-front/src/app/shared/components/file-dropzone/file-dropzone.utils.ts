export type FileRejectionReason = 'type' | 'size' | 'count';

export interface FileRejection {
  readonly file: File;
  readonly reason: FileRejectionReason;
  readonly message: string;
}

/**
 * Indica si un archivo cumple `accept` (mismo formato que el atributo HTML):
 * extensiones (".pdf"), tipos exactos ("image/png") o comodines ("image/*").
 */
export function matchesAccept(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((r) => r.trim().toLowerCase())
    .filter(Boolean);
  if (rules.length === 0) {
    return true;
  }
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return name.endsWith(rule);
    }
    if (rule.endsWith('/*')) {
      return type.startsWith(rule.slice(0, -1));
    }
    return type === rule;
  });
}

/** 1536 → "1,5 KB". */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toLocaleString('es-CL', { maximumFractionDigits: digits })} ${units[unit]}`;
}

/** Ícono Feather según el tipo de archivo. */
export function fileIcon(file: File): string {
  if (file.type.startsWith('image/')) {
    return 'image';
  }
  if (file.type === 'application/pdf' || file.type.startsWith('text/')) {
    return 'file-text';
  }
  return 'file';
}

/** Clave para no agregar dos veces el mismo archivo. */
export function fileKey(file: File): string {
  return `${file.name}|${file.size}|${file.lastModified}`;
}
