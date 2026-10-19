import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { IconComponent } from '../../../shared/icons/icon.component';

@Component({
  selector: 'app-admin-page-header',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-page-header.component.html',
})
export class AdminPageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input('');
  readonly createLabel = input('Nuevo');
  readonly create = output<void>();
  readonly refresh = output<void>();
}
