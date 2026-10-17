import angular from 'angular';

const template = `
  <sg-shell mode="admin"><header class="page-header"><div><p class="eyebrow">MANTENEDOR</p><h1>{{ $ctrl.definition.title }}</h1></div><span class="api-status">API conectada</span></header>
  <section class="maintenance"><div class="panel-actions"><button class="button button-secondary" type="button" ng-click="$ctrl.load()">↻ Actualizar</button><button class="button button-primary" type="button" ng-click="$ctrl.openCreate()">＋ {{ $ctrl.definition.newLabel }}</button></div><p class="message message-success" ng-if="$ctrl.message">{{ $ctrl.message }}</p><div class="state-card" ng-if="$ctrl.loading">Cargando mantenedor…</div><div class="state-card error-state" ng-if="!$ctrl.loading && $ctrl.error"><p>{{ $ctrl.error }}</p><button class="button button-secondary" type="button" ng-click="$ctrl.load()">Reintentar</button></div>
  <div class="state-card" ng-if="!$ctrl.loading && !$ctrl.error && !$ctrl.records.length">No hay registros aún.</div>
  <div class="table-wrap" ng-if="!$ctrl.loading && !$ctrl.error && $ctrl.records.length">
    <table ng-switch="$ctrl.entity"><thead ng-switch-when="users"><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Creación</th><th>Acciones</th></tr></thead><tbody ng-switch-when="users"><tr ng-repeat="item in $ctrl.records track by item.id"><td><strong>{{ item.fullName }}</strong></td><td>{{ item.email }}</td><td><span class="role-badge">{{ item.role }}</span></td><td>{{ $ctrl.dateTime(item.createdAt) }}</td><td class="actions"><button class="icon-button" ng-click="$ctrl.openEdit(item)">✎</button><button class="icon-button danger" ng-click="$ctrl.remove(item)">⌫</button></td></tr></tbody>
      <thead ng-switch-when="expenses"><tr><th>Fecha</th><th>Usuario</th><th>Categoría</th><th>Monto</th><th>Pago</th><th>Acciones</th></tr></thead><tbody ng-switch-when="expenses"><tr ng-repeat="item in $ctrl.records track by item.id"><td>{{ $ctrl.date(item.date) }}</td><td>{{ item.userName }}</td><td>{{ item.category }}</td><td><strong>{{ $ctrl.currency(item.amount) }}</strong></td><td>{{ item.paymentMethod }}</td><td class="actions"><button class="icon-button" ng-click="$ctrl.openEdit(item)">✎</button><button class="icon-button danger" ng-click="$ctrl.remove(item)">⌫</button></td></tr></tbody>
      <thead ng-switch-when="categories"><tr><th>Color</th><th>Icono</th><th>Nombre</th><th>Acciones</th></tr></thead><tbody ng-switch-when="categories"><tr ng-repeat="item in $ctrl.records track by item.id"><td><span class="color-dot" ng-style="{ background: item.colorHex || '#64748b' }"></span></td><td>{{ item.icon || '—' }}</td><td><strong>{{ item.name }}</strong></td><td class="actions"><button class="icon-button" ng-click="$ctrl.openEdit(item)">✎</button><button class="icon-button danger" ng-click="$ctrl.remove(item)">⌫</button></td></tr></tbody>
      <thead ng-switch-when="notifications"><tr><th>Estado</th><th>Usuario</th><th>Título</th><th>Mensaje</th><th>Creación</th><th>Acciones</th></tr></thead><tbody ng-switch-when="notifications"><tr ng-repeat="item in $ctrl.records track by item.id"><td><span class="status-badge">{{ item.read ? 'Leída' : 'Pendiente' }}</span></td><td>{{ item.userName }}</td><td><strong>{{ item.title }}</strong></td><td>{{ item.body }}</td><td>{{ $ctrl.dateTime(item.createdAt) }}</td><td class="actions"><button class="icon-button" ng-click="$ctrl.openEdit(item)">✎</button><button class="icon-button danger" ng-click="$ctrl.remove(item)">⌫</button></td></tr></tbody></table>
  </div></section>
  <div class="modal-backdrop" ng-if="$ctrl.editing" ng-click="$ctrl.closeModal()"><section class="modal" role="dialog" aria-modal="true" ng-click="$event.stopPropagation()"><div class="modal-header"><h2>{{ $ctrl.editing.id ? 'Editar' : $ctrl.definition.newLabel }}</h2><button class="icon-button" type="button" ng-click="$ctrl.closeModal()">×</button></div><form name="adminForm" class="form-grid" novalidate ng-submit="$ctrl.save(adminForm)" ng-switch="$ctrl.entity">
    <ng-container ng-switch-when="users"><label class="field"><span>Nombre completo</span><input ng-model="$ctrl.draft.fullName" required maxlength="120"></label><label class="field"><span>Correo electrónico</span><input ng-model="$ctrl.draft.email" type="email" required></label><label class="field"><span>Rol</span><select ng-model="$ctrl.draft.role" required><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></label><label class="field"><span>Contraseña {{ $ctrl.editing.id ? '(opcional)' : '' }}</span><input ng-model="$ctrl.draft.password" type="password" ng-required="!$ctrl.editing.id" minlength="8" maxlength="100"></label></ng-container>
    <ng-container ng-switch-when="categories"><label class="field"><span>Nombre</span><input ng-model="$ctrl.draft.name" required maxlength="80"></label><label class="field"><span>Icono</span><input ng-model="$ctrl.draft.icon" maxlength="80" placeholder="Ej.: 🛒"></label><label class="field"><span>Color</span><input ng-model="$ctrl.draft.colorHex" type="color"></label></ng-container>
    <ng-container ng-switch-when="expenses"><label class="field"><span>Usuario</span><select ng-model="$ctrl.draft.userId" required ng-options="user.id as (user.fullName + ' · ' + user.email) for user in $ctrl.users"></select></label><label class="field"><span>Monto</span><input ng-model="$ctrl.draft.amount" type="number" required min="0.01" step="0.01"></label><label class="field"><span>Categoría</span><input ng-model="$ctrl.draft.category" required maxlength="80" list="category-options"><datalist id="category-options"><option ng-repeat="category in $ctrl.categories" value="{{ category.name }}"></option></datalist></label><label class="field"><span>Fecha</span><input ng-model="$ctrl.draft.date" iso-date type="date" required></label><label class="field"><span>Método de pago</span><input ng-model="$ctrl.draft.paymentMethod" required maxlength="60"></label><label class="field field-wide"><span>Descripción</span><textarea ng-model="$ctrl.draft.description" rows="3" maxlength="500"></textarea></label></ng-container>
    <ng-container ng-switch-when="notifications"><label class="field"><span>Usuario</span><select ng-model="$ctrl.draft.userId" required ng-options="user.id as (user.fullName + ' · ' + user.email) for user in $ctrl.users"></select></label><label class="field"><span>Título</span><input ng-model="$ctrl.draft.title" required maxlength="140"></label><label class="field field-wide"><span>Mensaje</span><textarea ng-model="$ctrl.draft.body" required rows="4" maxlength="1000"></textarea></label><label class="checkbox-field"><input ng-model="$ctrl.draft.read" type="checkbox"> Marcar como leída</label></ng-container>
    <div class="form-buttons field-wide"><button class="button button-secondary" type="button" ng-click="$ctrl.closeModal()">Cancelar</button><button class="button button-primary" type="submit" ng-disabled="$ctrl.saving">{{ $ctrl.saving ? 'Guardando…' : 'Guardar' }}</button></div></form></section></div>
  </sg-shell>`;

const definitions = {
  users: { title: 'Usuarios', newLabel: 'Nuevo usuario', api: 'users' },
  expenses: { title: 'Gastos', newLabel: 'Nuevo gasto', api: 'expenses' },
  categories: { title: 'Categorías', newLabel: 'Nueva categoría', api: 'categories' },
  notifications: { title: 'Notificaciones', newLabel: 'Nueva notificación', api: 'notifications' }
};

angular.module('snapGastoAngularJs').component('sgAdminPage', {
  template,
  controller: ['$route', '$q', '$window', 'api', function adminPageController($route, $q, $window, api) {
    this.entity = $route.current.entity;
    this.definition = definitions[this.entity];
    this.today = () => new Date().toISOString().slice(0, 10);
    this.load = () => {
      this.loading = true; this.error = '';
      const requests = { records: api[this.definition.api].list() };
      if (this.entity === 'expenses' || this.entity === 'notifications') requests.users = api.users.list();
      if (this.entity === 'expenses') requests.categories = api.categories.list();
      $q.all(requests).then((result) => { this.records = result.records; this.users = result.users || []; this.categories = result.categories || []; }).catch((error) => { this.error = error.message; }).finally(() => { this.loading = false; });
    };
    this.openCreate = () => { this.message = ''; this.editing = {}; this.draft = this.emptyDraft(); };
    this.openEdit = (item) => { this.message = ''; this.editing = item; this.draft = { ...item, password: '', icon: item.icon || '', colorHex: item.colorHex || '#2563eb', description: item.description || '' }; };
    this.closeModal = () => { this.editing = null; };
    this.emptyDraft = () => ({
      users: { fullName: '', email: '', role: 'USER', password: '' },
      categories: { name: '', icon: '', colorHex: '#2563eb' },
      expenses: { userId: this.users?.[0]?.id || '', amount: null, category: this.categories?.[0]?.name || '', date: this.today(), paymentMethod: 'Tarjeta', description: '' },
      notifications: { userId: this.users?.[0]?.id || '', title: '', body: '', read: false }
    })[this.entity];
    this.payload = () => {
      const draft = this.draft;
      if (this.entity === 'users') return { fullName: draft.fullName.trim(), email: draft.email.trim(), role: draft.role, ...(draft.password ? { password: draft.password } : {}) };
      if (this.entity === 'categories') return { name: draft.name.trim(), icon: draft.icon.trim() || null, colorHex: draft.colorHex || null };
      if (this.entity === 'expenses') return { userId: draft.userId, amount: Number(draft.amount), category: draft.category.trim(), date: draft.date, paymentMethod: draft.paymentMethod.trim(), description: draft.description.trim() || null };
      return { userId: draft.userId, title: draft.title.trim(), body: draft.body.trim(), read: Boolean(draft.read) };
    };
    this.save = (form) => {
      if (form.$invalid) { form.$setSubmitted(); return; }
      this.saving = true;
      const client = api[this.definition.api];
      const request = this.editing.id ? client.update(this.editing.id, this.payload()) : client.create(this.payload());
      request.then(() => { this.message = 'Registro guardado correctamente.'; this.closeModal(); this.load(); }).catch((error) => { this.error = error.message; }).finally(() => { this.saving = false; });
    };
    this.remove = (item) => {
      if (!$window.confirm('¿Eliminar este registro? Esta acción no se puede deshacer.')) return;
      api[this.definition.api].remove(item.id).then(() => { this.message = 'Registro eliminado.'; this.load(); }).catch((error) => { this.error = error.message; });
    };
    this.currency = (amount) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(amount || 0);
    this.date = (value) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium' }).format(new Date(`${value}T12:00:00`));
    this.dateTime = (value) => new Intl.DateTimeFormat('es-CL', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
    this.$onInit = () => this.load();
  }]
});
