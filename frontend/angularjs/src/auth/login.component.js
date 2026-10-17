import angular from 'angular';

const template = `
  <main class="auth-layout"><section class="auth-card" aria-labelledby="login-title">
    <p class="eyebrow">SNAPGASTO</p><h1 id="login-title">{{ $ctrl.registerMode ? 'Crear cuenta' : 'Iniciar sesión' }}</h1>
    <p class="muted">Registra ingresos personales y administra el sistema según tu rol.</p>
    <form name="loginForm" class="form-stack" novalidate ng-submit="$ctrl.submit(loginForm)">
      <label class="field" ng-if="$ctrl.registerMode"><span>Nombre completo</span><input ng-model="$ctrl.credentials.fullName" required maxlength="120" autocomplete="name"></label>
      <label class="field"><span>Correo electrónico</span><input ng-model="$ctrl.credentials.email" type="email" required autocomplete="email"></label>
      <label class="field"><span>Contraseña</span><input ng-model="$ctrl.credentials.password" type="password" required minlength="8" autocomplete="current-password"></label>
      <p class="message message-error" ng-if="$ctrl.error" role="alert">{{ $ctrl.error }}</p>
      <button class="button button-primary" type="submit" ng-disabled="$ctrl.saving">{{ $ctrl.saving ? 'Procesando…' : ($ctrl.registerMode ? 'Crear cuenta' : 'Ingresar') }}</button>
    </form>
    <button class="button button-link" type="button" ng-click="$ctrl.toggleMode()">{{ $ctrl.registerMode ? 'Ya tengo una cuenta' : 'Crear la primera cuenta' }}</button>
  </section></main>`;

angular.module('snapGastoAngularJs').component('sgLogin', {
  template,
  controller: ['authApi', '$location', function loginController(authApi, $location) {
    this.registerMode = false;
    this.credentials = { fullName: '', email: '', password: '' };
    this.toggleMode = () => { this.registerMode = !this.registerMode; this.error = ''; };
    this.submit = (form) => {
      if (form.$invalid) { form.$setSubmitted(); return; }
      this.saving = true;
      this.error = '';
      const payload = { ...this.credentials, email: this.credentials.email.trim() };
      const request = this.registerMode ? authApi.register(payload) : authApi.login(payload);
      request.then(() => $location.path('/incomes')).catch((error) => { this.error = error.message; }).finally(() => { this.saving = false; });
    };
  }]
});
