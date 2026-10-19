import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type AlertIcon = 'error' | 'success' | 'warning' | 'info';

export interface TopAlertOptions {
  icon?: AlertIcon;
  title: string;
  text?: string;
  /** Duración en ms (por defecto 10 s). */
  timer?: number;
}

/**
 * Alertas SweetAlert2 tipo "toast" en la parte superior.
 * sweetalert2 se carga de forma diferida: no entra al bundle inicial ni se ejecuta en SSR.
 */
@Injectable({ providedIn: 'root' })
export class AlertService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  async top({ icon = 'error', title, text, timer = 10_000 }: TopAlertOptions): Promise<void> {
    if (!this.isBrowser) {
      return;
    }
    const { default: Swal } = await import('sweetalert2');
    await Swal.fire({
      toast: true,
      position: 'top',
      icon,
      title,
      text,
      timer,
      timerProgressBar: true,
      showConfirmButton: false,
      showCloseButton: true,
    });
  }

  error(title: string, text?: string): Promise<void> {
    return this.top({ icon: 'error', title, text });
  }
}
