import angular from 'angular';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
const baseUrl = rawBaseUrl.replace(/\/$/, '');

// Sólo esta constante conoce dónde vive la API; los servicios usan rutas relativas al contrato.
angular.module('snapGastoAngularJs').constant('apiConfig', { baseUrl });
