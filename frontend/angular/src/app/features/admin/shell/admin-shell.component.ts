import { Component, inject } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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
  protected menu: Menu[] | any;;
  constructor() {
    this.navServices.items.subscribe(menuItems => {
      this.menu = menuItems
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationEnd) {
          menuItems.filter(items => {
            if (items.path === event.url)
              this.setNavActive(items)
            if (!items.children) return false
            items.children.filter(subItems => {
              if (subItems.path === event.url)
                this.setNavActive(subItems)
              if (!subItems.children) return false
              subItems.children.filter(subSubItems => {
                if (subSubItems.path === event.url)
                  this.setNavActive(subSubItems)
              })
              return
            })
            return
          }
          )
        }
      })
    })
  }
  setNavActive(item: any) {
    console.log(`navActive ${JSON.stringify(item)}`)
    this.appStore.start(item, 'snapgasto.admin.nav.app');
    this.menu.filter((menuItem: any) => {
      if (menuItem != item)
        menuItem.active = false
      if (menuItem.children && menuItem.children.includes(item))
        menuItem.active = true
      if (menuItem.children) {
        menuItem.children.filter((submenuItems: any) => {
          if (submenuItems.children && submenuItems.children.includes(item)) {
            menuItem.active = true
            submenuItems.active = true
          }
        })
      }
    })
  }
  logout(): void {
    this.authApi.logout();
    void this.router.navigateByUrl('/login');
  }
}
