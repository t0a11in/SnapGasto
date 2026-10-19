import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { SessionStore } from '../../../core/state/session.store';
import { IconComponent } from '../../../shared/icons/icon.component';

interface NavItem {
  label: string;
  link: string;
  icon: string;
}

const PERSONAL_NAV: NavItem[] = [
  { label: 'Ingresos', link: '/incomes', icon: 'trending-up' },
  { label: 'Gastos', link: '/expenses', icon: 'trending-down' },
];

const ADMIN_NAV: NavItem[] = [
  { label: 'Usuarios', link: '/admin/users', icon: 'users' },
  { label: 'Categorías', link: '/admin/categories', icon: 'tag' },
  { label: 'Gastos de usuarios', link: '/admin/expenses', icon: 'list' },
  { label: 'Notificaciones', link: '/admin/notifications', icon: 'bell' },
];

/** Shell autenticado: barra superior y menú lateral según rol. */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  private readonly session = inject(SessionStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly user = this.session.user;
  readonly isAdmin = this.session.isAdmin;
  readonly personalNav = PERSONAL_NAV;
  readonly adminNav = computed(() => (this.isAdmin() ? ADMIN_NAV : []));
  readonly initials = computed(() =>
    (this.user()?.fullName ?? '?')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]!.toUpperCase())
      .join(''),
  );
  readonly menuOpen = signal(false);

  constructor() {
    // Cierra el menú móvil al navegar.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.menuOpen.set(false));
  }

  toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  logout(): void {
    this.auth.logout();
  }
}
