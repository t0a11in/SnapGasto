import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHostComponent } from './shared/components/toast-host/toast-host.component';

@Component({
  imports: [RouterOutlet, ToastHostComponent],
  selector: 'app-root',
  templateUrl: './app.html',
})
export class App {}
