import { Component, DestroyRef, computed, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';
import { AuthApiService } from '../../../core/services/auth-api.service';
import { SessionStore } from '../../../core/state/session.store';
import { NavService } from '../../../shared/services/nav.service';
import { Menu } from '../../../shared/models/api.models';
import { FeatherIconsComponent } from '../../../shared/components/feather-icons/feather-icons.component';
import { AppStore } from '../../../core/state/App.store';
import { HeaderAdmin } from '../../../shared/components/header-admin/header-admin';

@Component({
  selector: 'app-admin-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FeatherIconsComponent, HeaderAdmin],
  templateUrl: './admin-shell.component.html'
})
export class AdminShellComponent {
  readonly sessionStore = inject(SessionStore);
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private readonly navServices = inject(NavService);
  private readonly appStore = inject(AppStore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly menu = computed(() => this.navServices.menuFor(this.sessionStore.isAdmin()));

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => this.setNavActive(event.urlAfterRedirects));
  }

  private setNavActive(url: string): void {
    const item = this.menu().find((menuItem) => menuItem.path === url);
    if (item) this.appStore.start(item, 'snapgasto.admin.nav.app');
  }

  logout(): void {
    this.authApi.logout();
    void this.router.navigateByUrl('/login');
  }
}
