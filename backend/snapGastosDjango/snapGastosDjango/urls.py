from django.urls import path

from api import views

urlpatterns = [
    path("api/auth/register", views.register),
    path("api/auth/login", views.login),
    path("api/auth/google", views.google_login),
    path("api/auth/session", views.session),
    path("api/users/me", views.me),
    path("api/expenses", views.expenses),
    path("api/expenses/<uuid:expense_id>", views.expenses),
    path("api/incomes/v1/listar", views.incomes_v1, {"action": "listar"}),
    path("api/incomes/v1/resumen", views.incomes_v1, {"action": "resumen"}),
    path("api/incomes/v1/crear", views.incomes_v1, {"action": "crear"}),
    path("api/incomes/v1/<uuid:income_id>/actualizar", views.incomes_v1, {"action": "actualizar"}),
    path("api/incomes/v1/<uuid:income_id>/eliminar", views.incomes_v1, {"action": "eliminar"}),
    path("api/admin/users", views.admin_users),
    path("api/admin/users/<uuid:user_id>", views.admin_users),
    path("api/admin/categories", views.admin_categories),
    path("api/admin/categories/<uuid:category_id>", views.admin_categories),
    path("api/admin/expenses", views.admin_expenses),
    path("api/admin/expenses/<uuid:expense_id>", views.admin_expenses),
    path("api/admin/notifications", views.admin_notifications),
    path("api/admin/notifications/<uuid:notification_id>", views.admin_notifications),
    path("openapi/v1.json", views.openapi),
    path("swagger-ui/", views.swagger_ui),
]
