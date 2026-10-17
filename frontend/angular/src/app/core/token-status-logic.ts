import { effect, inject, Injectable, signal } from "@angular/core";
import { AppStore } from "./state/App.store";
import { TokenStatusApiService } from "./services/token-status-api.service";
import { finalize } from "rxjs";
import { TokenLife } from "../shared/models/api.models";



@Injectable({ providedIn: 'root' })
export class TokenStatusLogic {

    private readonly appStore = inject(AppStore);
    private readonly api = inject(TokenStatusApiService);

    private readonly loadingState = signal(false);
    private readonly errorState = signal<string | null>(null);

    readonly loading = this.loadingState.asReadonly();
    readonly error = this.errorState.asReadonly();

    constructor() {
        effect(() => {
            const estado = this.appStore.tokenLife();

            if (estado !== 'OPEN') {
                return;
            }

            this.consulta();
        });
    }


    cambioEstado(estado: TokenLife = 'CLOSED') {
        this.appStore.setTokenLife(estado);
    }

    consulta(): void {
        this.loadingState.set(true);
        this.errorState.set(null);

        this.api.check()
            .pipe(
                finalize(() => this.loadingState.set(false))
            )
            .subscribe({
                next: () => {
                    console.log('cambioooo')
                    this.cambioEstado('OPEN');
                },
                error: (error: unknown) => {
                    console.log('error\n', JSON.stringify(error))
                    console.log('error\n', error)

                    const message = error instanceof Error
                        ? error.message
                        : 'No se pudo comprobar el estado del token';

                    this.errorState.set(message);
                }
            });
    }
}
