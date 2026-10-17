import { Injectable, signal } from '@angular/core';
import { CircuitBraker, Menu, TokenLife } from '../../shared/models/api.models';

const STATE_JAVA_APP = 'snapgasto.admin.java.circuit_braker';
const STATE_NAV_APP = 'snapgasto.admin.nav.app';
const STATE_TOKEN_APP = 'snapgasto.admin.token.app';


@Injectable({ providedIn: 'root' })
export class AppStore {
    readonly circuit_braker = signal<CircuitBraker | null>(this.read<CircuitBraker>(STATE_JAVA_APP));
    readonly tokenLife = signal<TokenLife | null>(this.read<TokenLife>(STATE_TOKEN_APP));
    readonly navActive = signal<Menu | null>(this.read<Menu>(STATE_NAV_APP));
    start(
        ...[value, key]:
            | [value: CircuitBraker, key: typeof STATE_JAVA_APP]
            | [value: Menu, key: typeof STATE_NAV_APP]
            | [value: TokenLife, key: typeof STATE_TOKEN_APP]
    ): void {
        localStorage.setItem(key, JSON.stringify(value));
        switch (key) {
            case STATE_JAVA_APP:
                this.circuit_braker.set(value);
                break;
            case STATE_NAV_APP:
                this.navActive.set(value);
                break;
            case STATE_TOKEN_APP:
                this.tokenLife.set(value);
                break;

        }
    }

    setCircuitBreaker(state: CircuitBraker): void {
        this.start(state, STATE_JAVA_APP);
    }


    setTokenLife(state: TokenLife): void {
        this.start(state, STATE_TOKEN_APP);
    }

    private read<T>(key: string): T | null {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return JSON.parse(raw) as T;
        } catch {
            localStorage.removeItem(key);
            return null;
        }
    }

}
