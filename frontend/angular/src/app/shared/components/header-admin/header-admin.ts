import { CommonModule } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { AppStore } from '../../../core/state/App.store';
import { FeatherIconsComponent } from '../feather-icons/feather-icons.component';

@Component({
  selector: 'header-admin',
  imports: [CommonModule, FeatherIconsComponent],
  templateUrl: './header-admin.html',
  styleUrl: './header-admin.css',
})
export class HeaderAdmin {
  private readonly appStore = inject(AppStore);

  ubicacion = this.appStore.navActive
  estado = computed(() => this.appStore.tokenLife);

  // CircuitBraker = 'CLOSED' | 'OPEN' | 'HALF-OPEN';

  get estadoStr(): string {
    switch (this.appStore.tokenLife()) {
      case "CLOSED":
        return "SIN CONECCIÓN";
      case "OPEN":
        return "CON CONECCIÓN";
    }
    return "NONES";
  }

  cambioEstado(){
    console.log('acaaa')
    this.appStore.setTokenLife('OPEN')
  }
}
