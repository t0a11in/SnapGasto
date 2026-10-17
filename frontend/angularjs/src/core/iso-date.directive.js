import angular from 'angular';

// AngularJS modela input[type=date] como Date. Esta directiva mantiene el contrato API en YYYY-MM-DD.
angular.module('snapGastoAngularJs').directive('isoDate', function isoDateDirective() {
  return {
    require: 'ngModel',
    link: (_scope, _element, _attributes, ngModel) => {
      ngModel.$formatters.push((value) => value ? new Date(`${value}T12:00:00`) : null);
      ngModel.$parsers.push((value) => {
        if (!(value instanceof Date) || Number.isNaN(value.getTime())) return undefined;
        const offset = value.getTimezoneOffset() * 60_000;
        return new Date(value.getTime() - offset).toISOString().slice(0, 10);
      });
    }
  };
});
