import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  booleanAttribute,
  computed,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormValueControl, ValidationError } from '@angular/forms/signals';
import { validationMessages } from '../../forms/validation-messages';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { IconComponent } from '../icon/icon.component';
import { FileRejection, fileIcon, fileKey, formatFileSize, matchesAccept } from './file-dropzone.utils';

let nextId = 0;

/**
 * Zona para arrastrar o elegir archivos (fotos de boletas, PDF…). Valida tipo,
 * tamaño y cantidad, y lista los archivos elegidos con opción de quitarlos.
 * El valor es `File[]`; funciona con `[formField]` o `[(value)]`.
 *
 * ```html
 * <app-file-dropzone
 *   label="Boleta"
 *   accept="image/*,.pdf"
 *   [maxSizeMb]="5"
 *   [multiple]="false"
 *   [(value)]="files"
 *   (rejected)="onRejected($event)"
 * />
 * ```
 */
@Component({
  selector: 'app-file-dropzone',
  imports: [IconComponent, IconButtonComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './file-dropzone.component.html',
  styleUrl: './file-dropzone.component.scss',
})
export class FileDropzoneComponent implements FormValueControl<File[]> {
  readonly value = model<File[]>([]);

  readonly label = input('');
  readonly hint = input('');
  /** Tipos aceptados, igual que el atributo HTML: "image/*,.pdf". Vacío = cualquiera. */
  readonly accept = input('');
  readonly multiple = input(true, { transform: booleanAttribute });
  /** Cantidad máxima de archivos (solo con `multiple`). */
  readonly maxFiles = input<number | null>(null);
  /** Tamaño máximo por archivo, en MB. */
  readonly maxSizeMb = input(10);

  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly required = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();
  /** Archivos descartados en la última selección, con el motivo. */
  readonly rejected = output<FileRejection[]>();

  readonly zoneId = `sg-dropzone-${++nextId}`;
  readonly labelId = `${this.zoneId}-label`;
  readonly hintId = `${this.zoneId}-hint`;
  readonly errorId = `${this.zoneId}-errors`;

  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private dragDepth = 0;

  readonly dragging = signal(false);
  readonly lastRejections = signal<FileRejection[]>([]);

  readonly items = computed(() =>
    this.value().map((file) => ({ file, key: fileKey(file), icon: fileIcon(file), size: formatFileSize(file.size) })),
  );
  readonly limitsText = computed(() => {
    const parts: string[] = [];
    if (this.accept()) {
      parts.push(`Formatos: ${this.accept().replaceAll(',', ', ')}`);
    }
    parts.push(`Máximo ${this.maxSizeMb()} MB por archivo`);
    if (this.multiple() && this.maxFiles()) {
      parts.push(`hasta ${this.maxFiles()} archivos`);
    }
    return parts.join(' · ');
  });
  readonly messages = computed(() => [
    ...this.lastRejections().map((r) => r.message),
    ...(this.touched() ? validationMessages(this.errors()) : []),
  ]);
  readonly describedBy = computed(() =>
    [this.hintId, this.messages().length ? this.errorId : ''].filter(Boolean).join(' '),
  );

  openPicker(): void {
    if (!this.disabled()) {
      this.fileInput().nativeElement.click();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPicker();
    }
  }

  onDragEnter(event: DragEvent): void {
    event.preventDefault();
    if (!this.disabled()) {
      this.dragDepth++;
      this.dragging.set(true);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = this.disabled() ? 'none' : 'copy';
    }
  }

  onDragLeave(): void {
    this.dragDepth = Math.max(0, this.dragDepth - 1);
    if (this.dragDepth === 0) {
      this.dragging.set(false);
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragDepth = 0;
    this.dragging.set(false);
    if (!this.disabled()) {
      this.addFiles(Array.from(event.dataTransfer?.files ?? []));
    }
  }

  onFileInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.addFiles(Array.from(input.files ?? []));
    // Permite volver a elegir el mismo archivo después de quitarlo.
    input.value = '';
  }

  remove(key: string): void {
    this.value.update((files) => files.filter((f) => fileKey(f) !== key));
    this.touch.emit();
  }

  /** Valida y agrega archivos; los inválidos se informan en `rejected`. */
  addFiles(incoming: File[]): void {
    if (incoming.length === 0) {
      return;
    }
    const maxBytes = this.maxSizeMb() * 1024 * 1024;
    const rejections: FileRejection[] = [];
    const valid: File[] = [];

    for (const file of incoming) {
      if (!matchesAccept(file, this.accept())) {
        rejections.push({ file, reason: 'type', message: `"${file.name}" no tiene un formato permitido.` });
      } else if (file.size > maxBytes) {
        rejections.push({ file, reason: 'size', message: `"${file.name}" supera los ${this.maxSizeMb()} MB.` });
      } else {
        valid.push(file);
      }
    }

    let next: File[];
    if (!this.multiple()) {
      next = valid.length ? [valid[0]] : this.value();
      for (const extra of valid.slice(1)) {
        rejections.push({ file: extra, reason: 'count', message: `Solo se permite un archivo; se omitió "${extra.name}".` });
      }
    } else {
      const known = new Set(this.value().map(fileKey));
      next = [...this.value(), ...valid.filter((f) => !known.has(fileKey(f)))];
      const max = this.maxFiles();
      if (max && next.length > max) {
        for (const extra of next.slice(max)) {
          rejections.push({ file: extra, reason: 'count', message: `Máximo ${max} archivos; se omitió "${extra.name}".` });
        }
        next = next.slice(0, max);
      }
    }

    this.value.set(next);
    this.lastRejections.set(rejections);
    if (rejections.length) {
      this.rejected.emit(rejections);
    }
    this.touch.emit();
  }
}
