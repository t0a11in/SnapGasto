import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '../../../shared/icons/icon.component';

/** Contenedor visual compartido por login y registro. */
@Component({
  selector: 'app-auth-layout',
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
})
export class AuthLayoutComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
}
