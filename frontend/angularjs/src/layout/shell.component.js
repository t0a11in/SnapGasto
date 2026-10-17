import angular from 'angular';

const template = `
  <div class="app-shell" ng-class="{ 'personal-shell': $ctrl.mode === 'personal' }">
    <aside class="sidebar" ng-if="$ctrl.mode === 'admin'">
      <a class="brand" href="#!/incomes"><span>◈</span> SnapGasto</a>
      <p class="sidebar-caption">{{ $ctrl.session.isAdmin() ? 'ADMINISTRACIÓN' : 'MI DINERO' }}</p>
      <nav aria-label="Mantenedores">
        <a ng-if="$ctrl.session.isAdmin()" href="#!/admin/users">👥 Usuarios</a>
        <a ng-if="$ctrl.session.isAdmin()" href="#!/admin/expenses">▣ Gastos</a>
        <a href="#!/incomes">↗ Ingresos</a>
        <a ng-if="$ctrl.session.isAdmin()" href="#!/admin/categories">◉ Categorías</a>
        <a ng-if="$ctrl.session.isAdmin()" href="#!/admin/notifications">✉ Notificaciones</a>
      </nav>
      <section class="account-summary" ng-if="$ctrl.session.current() as activeSession">
        <strong>{{ activeSession.user.fullName }}</strong><span>{{ activeSession.user.email }}</span>
        <button class="button button-link" type="button" ng-click="$ctrl.logout()">Cerrar sesión</button>
      </section>
    </aside>
    <header class="topbar" ng-if="$ctrl.mode === 'personal'">
      <a class="brand" href="#!/incomes"><span>◈</span> SnapGasto</a>
      <div><a class="button button-secondary" ng-if="$ctrl.session.isAdmin()" href="#!/admin/users">Administración</a><button class="button button-link" type="button" ng-click="$ctrl.logout()">Cerrar sesión</button></div>
    </header>
    <section class="content" ng-transclude></section>
  </div>`;

angular.module('snapGastoAngularJs').component('sgShell', {
  transclude: true,
  bindings: { mode: '@' },
  template,
  controller: ['authApi', '$location', 'session', function shellController(authApi, $location, session) {
    this.session = session;
    this.logout = () => { authApi.logout(); $location.path('/login'); };
  }]
});
