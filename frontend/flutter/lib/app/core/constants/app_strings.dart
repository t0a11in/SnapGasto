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
  static const profile = 'Perfil';
  static const monthlyExpense = 'Gastado este mes';
  static const movements = 'Movimientos';
  static const recentExpenses = 'Últimos gastos';
  static const addExpense = 'Agregar gasto';
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
  static const emptyExpenses = 'Aún no registras gastos';
  static const emptyExpensesDetail =
      'Usa el botón + para crear tu primer movimiento.';
  static const retry = 'Reintentar';
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
