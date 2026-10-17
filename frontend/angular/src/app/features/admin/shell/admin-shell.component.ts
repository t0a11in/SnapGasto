import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { SessionStore } from '../../../core/state/session.store';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-shell.component.html'
})
export class AdminShellComponent {
  readonly sessionStore = inject(SessionStore);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);

  logout(): void {
    this.authApi.logout();
    void this.router.navigateByUrl('/login');
  }
}
