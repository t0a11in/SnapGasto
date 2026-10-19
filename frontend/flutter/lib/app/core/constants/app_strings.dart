/// Reúne los textos visibles del primer MVP para evitar literales en las vistas.
abstract final class AppStrings {
  static const appName = 'SnapGasto';
  static const email = 'Correo electrónico';
  static const password = 'Contraseña';
  static const passwordConfirmation = 'Confirmar contraseña';
  static const fullName = 'Nombre completo';
  static const signIn = 'Iniciar sesión';
  static const signUp = 'Crear cuenta';
  static const createAccount = '¿No tienes cuenta? Regístrate';
  static const existingAccount = '¿Ya tienes cuenta? Inicia sesión';
  static const dashboard = 'Resumen';
  static const expenses = 'Gastos';
  static const incomes = 'Ingresos';
  static const profile = 'Perfil';
  static const monthlyExpense = 'Gastado este mes';
  static const monthlyIncome = 'Ingresos del mes';
  static const movements = 'Movimientos';
  static const recentExpenses = 'Últimos gastos';
  static const addExpense = 'Agregar gasto';
  static const editExpense = 'Editar gasto';
  static const saveExpense = 'Guardar gasto';
  static const addIncome = 'Nuevo ingreso';
  static const editIncome = 'Editar ingreso';
  static const saveIncome = 'Guardar ingreso';
  static const saving = 'Guardando…';
  static const incomeRecords = 'Movimientos de ingresos';
  static const expenseRecords = 'Movimientos de gastos';
  static const incomeSource = 'Origen';
  static const cardIncome = 'Tarjeta';
  static const cashIncome = 'Físico';
  static const incomeTotal = 'Total del mes';
  static const monthToQuery = 'Mes a consultar';
  static const amount = 'Monto';
  static const category = 'Categoría';
  static const date = 'Fecha';
  static const description = 'Descripción';
  static const paymentMethod = 'Método de pago';
  static const save = 'Guardar';
  static const cancel = 'Cancelar';
  static const delete = 'Eliminar';
  static const deleteExpenseTitle = '¿Eliminar gasto?';
  static const deleteExpenseBody = 'Esta acción no se puede deshacer.';
  static const deleteIncomeTitle = '¿Eliminar ingreso?';
  static const deleteIncomeBody = 'Esta acción no se puede deshacer.';
  static const edit = 'Editar';
  static const emptyExpenses = 'Aún no registras gastos';
  static const emptyExpensesDetail =
      'Usa el botón + para crear tu primer movimiento.';
  static const emptyIncomes = 'Aún no registras ingresos en este mes';
  static const emptyIncomesDetail =
      'Usa el botón + para registrar dinero en tarjeta o efectivo.';
  static const descriptionOptional = 'Descripción (opcional)';
  static const retry = 'Reintentar';
  static const close = 'Cerrar';
  static const viewReceipt = 'Ver boleta';
  static const localReceipt = 'Boleta local';
  static const receiptUnavailable =
      'La imagen ya no está disponible en este dispositivo.';
  static const attachReceipt = 'Adjuntar boleta (opcional)';
  static const receiptAttached = 'Boleta adjunta';
  static const receiptLocalOnly = 'Se guardará solamente en este dispositivo.';
  static const removeReceipt = 'Quitar boleta';
  static const takePhoto = 'Tomar foto';
  static const chooseFromDevice = 'Seleccionar del dispositivo';
  static const logout = 'Cerrar sesión';
  static const role = 'Rol';
  static const invalidEmail = 'Ingresa un correo válido.';
  static const invalidPassword =
      'La contraseña debe tener al menos 8 caracteres.';
  static const requiredField = 'Este campo es obligatorio.';
  static const invalidAmount = 'Ingresa un monto mayor que cero.';
  static const passwordsDoNotMatch = 'Las contraseñas no coinciden.';
  static const loginFailed = 'No fue posible iniciar sesión.';
  static const connectionError = 'No fue posible conectar con el servidor.';
  static const unexpectedError = 'Ocurrió un error inesperado.';
  static const defaultCategory = 'General';
  static const defaultPaymentMethod = 'Tarjeta';
  static const categories = <String>[
    'General',
    'Alimentación',
    'Transporte',
    'Hogar',
    'Salud',
    'Ocio',
  ];
  static const paymentMethods = <String>[
    'Tarjeta',
    'Efectivo',
    'Transferencia',
  ];
}
