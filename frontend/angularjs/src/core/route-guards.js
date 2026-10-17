import angular from 'angular';

angular.module('snapGastoAngularJs').factory('routeGuards', ['$q', 'session', function routeGuardsFactory($q, session) {
  return {
    // Los resolve bloquean la creación del componente hasta validar la sesión local.
    requireAuth: () => session.hasSession() ? true : $q.reject('AUTH_REQUIRED'),
    requireAdmin: () => session.isAdmin() ? true : $q.reject('ADMIN_REQUIRED')
  };
}]);
