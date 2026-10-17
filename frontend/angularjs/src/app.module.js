import angular from 'angular';

// Módulo raíz: las funcionalidades se registran en archivos pequeños por responsabilidad.
angular.module('snapGastoAngularJs', ['ngRoute'])
  .config(['$routeProvider', function configureRoutes($routeProvider) {
    $routeProvider
      .when('/login', { template: '<sg-login></sg-login>', title: 'Login | SnapGasto' })
      .when('/incomes', {
        template: '<sg-incomes></sg-incomes>',
        title: 'Ingresos | SnapGasto',
        resolve: { session: ['routeGuards', (routeGuards) => routeGuards.requireAuth()] }
      })
      .when('/admin/users', adminRoute('users', 'Usuarios | SnapGasto'))
      .when('/admin/expenses', adminRoute('expenses', 'Gastos | SnapGasto'))
      .when('/admin/categories', adminRoute('categories', 'Categorías | SnapGasto'))
      .when('/admin/notifications', adminRoute('notifications', 'Notificaciones | SnapGasto'))
      .otherwise({ redirectTo: '/incomes' });

    function adminRoute(entity, title) {
      return {
        template: '<sg-admin-page></sg-admin-page>',
        entity,
        title,
        resolve: { session: ['routeGuards', (routeGuards) => routeGuards.requireAdmin()] }
      };
    }
  }])
  .run(['$rootScope', '$location', function routeErrors($rootScope, $location) {
    // Un guard rechazado nunca deja la pantalla anterior visible: vuelve al login.
    $rootScope.$on('$routeChangeError', () => $location.path('/login'));
    $rootScope.$on('$routeChangeSuccess', (_event, current) => {
      document.title = current.title || 'SnapGasto';
    });
  }]);
