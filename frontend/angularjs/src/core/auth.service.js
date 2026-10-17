import angular from 'angular';

angular.module('snapGastoAngularJs').factory('authApi', ['api', 'session', function authApiFactory(api, session) {
  function persist(response) {
    session.start(response);
    return response;
  }

  return {
    login: (payload) => api.auth.login(payload).then(persist),
    register: (payload) => api.auth.register(payload).then(persist),
    logout: () => session.clear()
  };
}]);
