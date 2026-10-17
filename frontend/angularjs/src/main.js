import angular from 'angular';
import 'angular-route';
import './styles.css';
import './app.module.js';
import './core/config.js';
import './core/session.service.js';
import './core/http-interceptor.js';
import './core/api.service.js';
import './core/auth.service.js';
import './core/route-guards.js';
import './core/iso-date.directive.js';
import './layout/shell.component.js';
import './auth/login.component.js';
import './incomes/incomes.component.js';
import './admin/admin-page.component.js';

// El bootstrap manual permite que Vite cargue módulos ES antes de iniciar AngularJS.
angular.element(document).ready(() => {
  angular.bootstrap(document, ['snapGastoAngularJs'], { strictDi: true });
});
