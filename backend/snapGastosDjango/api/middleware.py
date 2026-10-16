from django.conf import settings
from django.http import HttpResponse


class CorsMiddleware:
    """CORS sin dependencia adicional, compatible con los clientes web del monorepo."""
    def __init__(self, get_response): self.get_response = get_response
    def __call__(self, request):
        if request.method == "OPTIONS":
            response = HttpResponse(status=204)
        else:
            response = self.get_response(request)
        origin = request.headers.get("Origin")
        if origin and any(self.matches(pattern, origin) for pattern in settings.CORS_ALLOWED_ORIGINS):
            response["Access-Control-Allow-Origin"] = origin
            response["Vary"] = "Origin"
            response["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
        return response
    @staticmethod
    def matches(pattern, origin):
        return pattern == origin or (pattern.endswith("*") and origin.startswith(pattern[:-1]))
