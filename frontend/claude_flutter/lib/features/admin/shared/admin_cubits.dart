import '../../../core/data/admin_crud_api.dart';
import '../../../core/models/models.dart';
import 'admin_resource_cubit.dart';

class AdminUsersCubit extends AdminResourceCubit<AdminUserRequest, AdminUserResponse> {
  AdminUsersCubit(AdminUsersApi super.api);
}

class AdminCategoriesCubit extends AdminResourceCubit<CategoryRequest, CategoryResponse> {
  AdminCategoriesCubit(AdminCategoriesApi super.api);
}

class AdminExpensesCubit extends AdminResourceCubit<AdminExpenseRequest, AdminExpenseResponse> {
  AdminExpensesCubit(AdminExpensesApi super.api);
}

class AdminNotificationsCubit extends AdminResourceCubit<NotificationRequest, NotificationResponse> {
  AdminNotificationsCubit(AdminNotificationsApi super.api);
}
