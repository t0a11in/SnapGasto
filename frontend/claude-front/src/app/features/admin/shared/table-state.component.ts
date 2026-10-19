import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/** Fila de estado (cargando / error / vacío) para tablas de mantenedores. */
@Component({
  selector: 'tr[appTableState]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table-state.component.html',
})
export class TableStateComponent {
  readonly colspan = input.required<number>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly emptyText = input('No hay registros.');
  readonly retry = output<void>();
}
