import angular from 'angular';
import { apiErrorMessage } from './api-error.js';

angular.module('snapGastoAngularJs').factory('api', ['$http', '$q', 'apiConfig', function apiFactory($http, $q, apiConfig) {
  function request(method, path, data, params) {
    return $http({ method, url: `${apiConfig.baseUrl}${path}`, data, params })
      .then((response) => response.data)
      .catch((response) => $q.reject(new Error(apiErrorMessage(response.data))));
  }

  const admin = (resource) => ({
    list: () => request('GET', `/admin/${resource}`),
    create: (payload) => request('POST', `/admin/${resource}`, payload),
    update: (id, payload) => request('PUT', `/admin/${resource}/${id}`, payload),
    remove: (id) => request('DELETE', `/admin/${resource}/${id}`)
  });

  return {
    auth: {
      login: (payload) => request('POST', '/auth/login', payload),
      register: (payload) => request('POST', '/auth/register', payload)
    },
    incomes: {
      list: (month) => request('GET', '/incomes/v1/listar', null, { month }),
      summary: (month) => request('GET', '/incomes/v1/resumen', null, { month }),
      create: (payload) => request('POST', '/incomes/v1/crear', payload),
      update: (id, payload) => request('PUT', `/incomes/v1/${id}/actualizar`, payload),
      remove: (id) => request('DELETE', `/incomes/v1/${id}/eliminar`)
    },
    users: admin('users'),
    expenses: admin('expenses'),
    categories: admin('categories'),
    notifications: admin('notifications')
  };
}]);
