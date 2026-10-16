import json
from functools import wraps

from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .authentication import administrator, authenticated
from .errors import ApiError
from .firebase import FirebaseIdentityProvider
from .repositories import SqlServerStore
from .services import AdminService, AuthService, ExpenseService, IncomeService, user_response


def parse_json(request):
    try:
        return json.loads(request.body or "{}")
    except json.JSONDecodeError:
        raise ApiError(400, "El cuerpo JSON no es válido.")


def api_endpoint(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        try:
            return view(request, *args, **kwargs)
        except ApiError as error:
            return JsonResponse({"message": error.message}, status=error.status)
        except Exception:
            return JsonResponse({"message": "Ocurrió un error interno."}, status=500)
    return wrapped


def services():
    store = SqlServerStore()
    return AuthService(store, FirebaseIdentityProvider()), ExpenseService(store), IncomeService(store), AdminService(store)


@csrf_exempt
@api_endpoint
def register(request):
    if request.method != "POST": return HttpResponse(status=405)
    auth, _, _, _ = services()
    return JsonResponse(auth.register(parse_json(request)), status=201)


@csrf_exempt
@api_endpoint
def login(request):
    if request.method != "POST": return HttpResponse(status=405)
    auth, _, _, _ = services()
    return JsonResponse(auth.login(parse_json(request)))


@csrf_exempt
@api_endpoint
def google_login(request):
    if request.method != "POST": return HttpResponse(status=405)
    auth, _, _, _ = services()
    return JsonResponse(auth.login_with_google(parse_json(request)))


@api_endpoint
@authenticated
def session(request):
    if request.method != "GET": return HttpResponse(status=405)
    return JsonResponse(user_response(request.snapgasto_user))


@api_endpoint
@authenticated
def me(request):
    if request.method != "GET": return HttpResponse(status=405)
    return JsonResponse(user_response(request.snapgasto_user))


@csrf_exempt
@api_endpoint
@authenticated
def expenses(request, expense_id=None):
    _, service, _, _ = services()
    if request.method == "GET" and not expense_id: return JsonResponse(service.list_for(request.snapgasto_user), safe=False)
    if request.method == "POST" and not expense_id: return JsonResponse(service.create(parse_json(request), request.snapgasto_user), status=201)
    if request.method == "DELETE" and expense_id:
        service.delete(expense_id, request.snapgasto_user); return HttpResponse(status=204)
    return HttpResponse(status=405)


@csrf_exempt
@api_endpoint
@authenticated
def incomes_v1(request, action, income_id=None):
    _, _, service, _ = services()
    month = request.GET.get("month")
    if request.method == "GET" and action == "listar":
        return JsonResponse(service.list_for(request.snapgasto_user, month), safe=False)
    if request.method == "GET" and action == "resumen":
        return JsonResponse(service.summary_for(request.snapgasto_user, month))
    if request.method == "POST" and action == "crear":
        return JsonResponse(service.create(parse_json(request), request.snapgasto_user), status=201)
    if request.method == "PUT" and action == "actualizar" and income_id:
        return JsonResponse(service.update(income_id, parse_json(request), request.snapgasto_user))
    if request.method == "DELETE" and action == "eliminar" and income_id:
        service.delete(income_id, request.snapgasto_user)
        return HttpResponse(status=204)
    return HttpResponse(status=405)


@csrf_exempt
@api_endpoint
@administrator
def admin_users(request, user_id=None):
    _, _, _, service = services()
    if request.method == "GET" and not user_id: return JsonResponse(service.list_users(), safe=False)
    if request.method == "POST" and not user_id: return JsonResponse(service.create_user(parse_json(request)), status=201)
    if request.method == "PUT" and user_id: return JsonResponse(service.update_user(user_id, parse_json(request)))
    if request.method == "DELETE" and user_id: service.delete_user(user_id, request.snapgasto_user); return HttpResponse(status=204)
    return HttpResponse(status=405)


@csrf_exempt
@api_endpoint
@administrator
def admin_categories(request, category_id=None):
    _, _, _, service = services()
    if request.method == "GET" and not category_id: return JsonResponse(service.list_categories(), safe=False)
    if request.method == "POST" and not category_id: return JsonResponse(service.create_category(parse_json(request)), status=201)
    if request.method == "PUT" and category_id: return JsonResponse(service.update_category(category_id, parse_json(request)))
    if request.method == "DELETE" and category_id: service.delete_category(category_id); return HttpResponse(status=204)
    return HttpResponse(status=405)


@csrf_exempt
@api_endpoint
@administrator
def admin_expenses(request, expense_id=None):
    _, _, _, service = services()
    if request.method == "GET" and not expense_id: return JsonResponse(service.list_expenses(), safe=False)
    if request.method == "POST" and not expense_id: return JsonResponse(service.create_expense(parse_json(request)), status=201)
    if request.method == "PUT" and expense_id: return JsonResponse(service.update_expense(expense_id, parse_json(request)))
    if request.method == "DELETE" and expense_id: service.delete_expense(expense_id); return HttpResponse(status=204)
    return HttpResponse(status=405)


@csrf_exempt
@api_endpoint
@administrator
def admin_notifications(request, notification_id=None):
    _, _, _, service = services()
    if request.method == "GET" and not notification_id: return JsonResponse(service.list_notifications(), safe=False)
    if request.method == "POST" and not notification_id: return JsonResponse(service.create_notification(parse_json(request)), status=201)
    if request.method == "PUT" and notification_id: return JsonResponse(service.update_notification(notification_id, parse_json(request)))
    if request.method == "DELETE" and notification_id: service.delete_notification(notification_id); return HttpResponse(status=204)
    return HttpResponse(status=405)


@api_endpoint
def openapi(_request):
    secured = {"security": [{"bearerAuth": []}]}
    paths = {
        "/api/auth/register": {"post": {"summary": "Registrar cuenta"}},
        "/api/auth/login": {"post": {"summary": "Iniciar sesión"}},
        "/api/auth/google": {"post": {"summary": "Iniciar sesión con Google/Firebase"}},
        "/api/auth/session": {"get": {"summary": "Restaurar sesión", **secured}},
        "/api/users/me": {"get": {"summary": "Perfil actual", **secured}},
        "/api/expenses": {"get": {"summary": "Listar gastos propios", **secured}, "post": {"summary": "Crear gasto propio", **secured}},
        "/api/expenses/{expenseId}": {"delete": {"summary": "Eliminar gasto propio", **secured}},
        "/api/incomes/v1/listar": {"get": {"summary": "Listar ingresos propios por mes", **secured}},
        "/api/incomes/v1/resumen": {"get": {"summary": "Resumen de tarjeta, físico y total", **secured}},
        "/api/incomes/v1/crear": {"post": {"summary": "Crear ingreso propio", **secured}},
        "/api/incomes/v1/{incomeId}/actualizar": {"put": {"summary": "Actualizar ingreso propio", **secured}},
        "/api/incomes/v1/{incomeId}/eliminar": {"delete": {"summary": "Eliminar ingreso propio", **secured}},
    }
    for resource, identifier, title in (("users", "userId", "usuarios"), ("categories", "categoryId", "categorías"), ("expenses", "expenseId", "gastos"), ("notifications", "notificationId", "notificaciones")):
        paths[f"/api/admin/{resource}"] = {"get": {"summary": f"Listar {title}", **secured}, "post": {"summary": f"Crear {title}", **secured}}
        paths[f"/api/admin/{resource}/{{{identifier}}}"] = {"put": {"summary": f"Actualizar {title}", **secured}, "delete": {"summary": f"Eliminar {title}", **secured}}
    return JsonResponse({"openapi": "3.0.3", "info": {"title": "SnapGasto API · Django", "version": "v1"}, "components": {"securitySchemes": {"bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}}}, "paths": paths})


def swagger_ui(_request):
    return HttpResponse("""<!doctype html><html><head><title>SnapGasto Django API</title><link rel=\"stylesheet\" href=\"https://unpkg.com/swagger-ui-dist/swagger-ui.css\"></head><body><div id=\"swagger-ui\"></div><script src=\"https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js\"></script><script>SwaggerUIBundle({url:'/openapi/v1.json',dom_id:'#swagger-ui'})</script></body></html>""")
