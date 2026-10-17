import angular from 'angular';
import { defaultIncomeDate, monthFromDate, todayIso } from '../core/date.js';

const template = `
  <sg-shell mode="admin"><header class="page-header"><div><p class="eyebrow">MANTENEDOR</p><h1 id="income-title">Ingresos</h1></div><span class="api-status">API conectada</span></header>
  <section class="maintenance" aria-labelledby="income-title"><div class="panel-actions"><button class="button button-secondary" type="button" ng-click="$ctrl.load()">↻ Actualizar</button><button class="button button-primary" type="button" ng-click="$ctrl.openCreate()">＋ Nuevo ingreso</button></div>
    <section class="month-toolbar"><label class="field month-field"><span>Mes a consultar</span><input type="month" ng-model="$ctrl.selectedMonth" max="{{ $ctrl.currentMonth }}" ng-change="$ctrl.load()"></label><button class="button button-secondary" type="button" ng-click="$ctrl.load()">↻ Actualizar</button></section>
    <section class="income-summary" ng-if="$ctrl.summary"><article class="summary-card"><span>Tarjeta</span><strong>{{ $ctrl.currency($ctrl.summary.totalTarjeta) }}</strong></article><article class="summary-card"><span>Físico</span><strong>{{ $ctrl.currency($ctrl.summary.totalFisico) }}</strong></article><article class="summary-card summary-total"><span>Total del mes</span><strong>{{ $ctrl.currency($ctrl.summary.total) }}</strong></article></section>
    <p class="message message-success" ng-if="$ctrl.message" role="status">{{ $ctrl.message }}</p>
    <div class="state-card" ng-if="$ctrl.loading">Cargando ingresos…</div>
    <div class="state-card error-state" ng-if="!$ctrl.loading && $ctrl.error"><p>{{ $ctrl.error }}</p><button class="button button-secondary" type="button" ng-click="$ctrl.load()">Reintentar</button></div>
    <div class="state-card" ng-if="!$ctrl.loading && !$ctrl.error && !$ctrl.incomes.length">No hay ingresos para este mes.</div>
    <div class="table-wrap" ng-if="!$ctrl.loading && !$ctrl.error && $ctrl.incomes.length"><table><thead><tr><th>Fecha</th><th>Origen</th><th>Descripción</th><th>Monto</th><th>Acciones</th></tr></thead><tbody><tr ng-repeat="income in $ctrl.incomes track by income.id"><td>{{ $ctrl.date(income.date) }}</td><td><span class="income-type" ng-class="{ 'income-type-card': income.type === 'TARJETA' }">{{ income.type === 'TARJETA' ? 'Tarjeta' : 'Físico' }}</span></td><td>{{ income.description || '—' }}</td><td><strong>{{ $ctrl.currency(income.amount) }}</strong></td><td class="actions"><button class="icon-button" type="button" ng-click="$ctrl.openEdit(income)" aria-label="Editar">✎</button><button class="icon-button danger" type="button" ng-click="$ctrl.remove(income)" aria-label="Eliminar">⌫</button></td></tr></tbody></table></div>
    <div class="modal-backdrop" ng-if="$ctrl.editing" ng-click="$ctrl.closeModal()"><section class="modal income-modal" role="dialog" aria-modal="true" ng-click="$event.stopPropagation()"><div class="modal-header"><h2>{{ $ctrl.editing.id ? 'Editar ingreso' : 'Nuevo ingreso' }}</h2><button class="icon-button" type="button" ng-click="$ctrl.closeModal()">×</button></div><form name="incomeForm" class="form-grid" novalidate ng-submit="$ctrl.save(incomeForm)"><label class="field"><span>Monto</span><input type="number" ng-model="$ctrl.draft.amount" required min="0.01" step="0.01" inputmode="decimal"></label><label class="field"><span>Origen</span><select ng-model="$ctrl.draft.type" required><option value="TARJETA">Tarjeta</option><option value="FISICO">Físico</option></select></label><label class="field"><span>Fecha</span><input type="date" iso-date ng-model="$ctrl.draft.date" required max="{{ $ctrl.currentDate }}"></label><label class="field field-wide"><span>Descripción <em>(opcional)</em></span><textarea ng-model="$ctrl.draft.description" rows="3" maxlength="500"></textarea></label><div class="form-buttons field-wide"><button class="button button-secondary" type="button" ng-click="$ctrl.closeModal()">Cancelar</button><button class="button button-primary" type="submit" ng-disabled="$ctrl.saving">{{ $ctrl.saving ? 'Guardando…' : 'Guardar ingreso' }}</button></div></form></section></div>
  </section></sg-shell>`;

angular.module('snapGastoAngularJs').component('sgIncomes', {
  template,
  controller: ['$q', 'api', '$window', function incomesController($q, api, $window) {
    this.currentDate = todayIso();
    this.currentMonth = monthFromDate();
    this.selectedMonth = this.currentMonth;
    this.incomes = [];

    // Una única carga consulta lista y resumen en paralelo para mantener ambas vistas sincronizadas.
    this.load = () => {
      this.loading = true;
      this.error = '';
      $q.all([api.incomes.list(this.selectedMonth), api.incomes.summary(this.selectedMonth)])
        .then(([incomes, summary]) => { this.incomes = incomes; this.summary = summary; })
        .catch((error) => { this.error = error.message; })
        .finally(() => { this.loading = false; });
    };
    this.openCreate = () => {
      this.message = '';
      this.editing = {};
      this.draft = { amount: null, type: 'TARJETA', date: defaultIncomeDate(this.selectedMonth, this.currentMonth, this.currentDate), description: '' };
    };
    this.openEdit = (income) => { this.message = ''; this.editing = income; this.draft = { ...income, description: income.description || '' }; };
    this.closeModal = () => { this.editing = null; };
    this.save = (form) => {
      if (form.$invalid) { form.$setSubmitted(); return; }
      this.saving = true;
      const payload = { ...this.draft, amount: Number(this.draft.amount), description: this.draft.description?.trim() || null };
      const request = this.editing.id ? api.incomes.update(this.editing.id, payload) : api.incomes.create(payload);
      request.then(() => { this.message = 'Ingreso guardado correctamente.'; this.closeModal(); this.load(); }).catch((error) => { this.error = error.message; }).finally(() => { this.saving = false; });
    };
    this.remove = (income) => {
      if (!$window.confirm(`¿Eliminar el ingreso de ${this.currency(income.amount)}?`)) return;
      api.incomes.remove(income.id).then(() => { this.message = 'Ingreso eliminado.'; this.load(); }).catch((error) => { this.error = error.message; });
    };
    this.currency = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(amount || 0);
    this.date = (value) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
    this.$onInit = () => this.load();
  }]
});
