import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import * as feather from 'feather-icons';
import type { FeatherIconNames } from 'feather-icons';

@Component({
  selector: 'app-feather-icons',
  standalone: true,
  templateUrl: './feather-icons.component.html',
  styleUrls: ['./feather-icons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatherIconsComponent {
  readonly icon = input<string>();

  private readonly sanitizer = inject(DomSanitizer);

  protected readonly svg = computed<SafeHtml | null>(() => {
    const iconName = this.icon();

    if (!iconName) {
      return null;
    }

    const icon = feather.icons[iconName as FeatherIconNames];

    if (!icon) {
      return null;
    }

    return this.sanitizer.bypassSecurityTrustHtml(
      icon.toSvg({
        'aria-hidden': 'true',
        focusable: 'false',
      }),
    );
  });
}
