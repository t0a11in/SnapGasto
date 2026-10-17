import angular from 'angular';

angular.module('snapGastoAngularJs')
  .factory('authInterceptor', ['$q', '$location', 'session', 'apiConfig', function authInterceptor($q, $location, session, apiConfig) {
    return {
      request(config) {
        const authorization = session.authorization();
        if (authorization && config.url.startsWith(apiConfig.baseUrl)) {
          config.headers = config.headers || {};
          config.headers.Authorization = authorization;
        }
        return config;
      },
      responseError(rejection) {
        // El token es una comodidad del cliente; el backend sigue siendo quien autoriza.
        if (rejection.status === 401) {
          session.clear();
          $location.path('/login');
        }
        return $q.reject(rejection);
      }
    };
  }])
  .config(['$httpProvider', function configureHttp($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  }]);
