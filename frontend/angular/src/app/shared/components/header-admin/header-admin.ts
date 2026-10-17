import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AppStore } from '../../../core/state/App.store';
import { FeatherIconsComponent } from '../feather-icons/feather-icons.component';
import { TokenStatusApiService } from '../../../core/services/token-status-api.service';
import { TokenLife } from '../../models/api.models';
import { TokenStatusLogic } from '../../../core/token-status-logic';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'header-admin',
  imports: [CommonModule, FeatherIconsComponent],
  templateUrl: './header-admin.html',
  styleUrl: './header-admin.css',
})
export class HeaderAdmin {
  private readonly appStore = inject(AppStore);
  private readonly tokenStatusLogic = inject(TokenStatusLogic);
  sesionStat = inject(SessionStore).session();
  ubicacion = this.appStore.navActive
  estado = computed(() => this.appStore.tokenLife);

  // constructor() {
  //   effect(async () => {
  //     const estado =this.appStore.tokenLife();
  //     if(estado == 'CLOSED'){
  //       const data = await this.tokenStatusApiService.check().subscribe({
  //     next: (data) => this.cambioEstado('OPEN'),
  //     error: (error: Error) => { this.error.set(error.message); this.loading.set(false); },
  //     complete: () => this.loading.set(false)


  //       });


  //     }
  //   });
  // }


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

  cambioEstado(estado: TokenLife = 'CLOSED') {
    console.log('acaaa')
    if (this.appStore.tokenLife() != estado) {

      this.appStore.setTokenLife(estado);
    }else{
      this.appStore.setTokenLife('OPEN');

    }
  }

}
