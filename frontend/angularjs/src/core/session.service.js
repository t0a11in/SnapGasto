import angular from 'angular';

const storageKey = 'snapgasto.angularjs.session';

angular.module('snapGastoAngularJs').factory('session', ['$window', function sessionFactory($window) {
  let current = readSession();

  function readSession() {
    try {
      const saved = JSON.parse($window.localStorage.getItem(storageKey) || 'null');
      return saved?.accessToken && saved?.user ? saved : null;
    } catch {
      return null;
    }
  }

  function start(nextSession) {
    current = nextSession;
    $window.localStorage.setItem(storageKey, JSON.stringify(nextSession));
  }

  function clear() {
    current = null;
    $window.localStorage.removeItem(storageKey);
  }

  return {
    start,
    clear,
    current: () => current,
    hasSession: () => Boolean(current?.accessToken),
    isAdmin: () => current?.user?.role === 'ADMIN',
    authorization: () => current?.accessToken ? `Bearer ${current.accessToken}` : null
  };
}]);
