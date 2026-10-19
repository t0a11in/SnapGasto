import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent, ConfirmOptions } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly modal = inject(NgbModal);

  confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.modal.open(ConfirmDialogComponent, {
      centered: true,
      ariaLabelledBy: 'confirm-title',
    });
    (ref.componentInstance as ConfirmDialogComponent).options.set(options);
    return ref.result.then(
      (r: unknown) => r === true,
      () => false,
    );
  }
}
