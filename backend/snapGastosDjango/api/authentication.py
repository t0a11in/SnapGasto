from functools import wraps

from .errors import forbidden, unauthorized
from .repositories import SqlServerStore
from .services import TokenService


def authenticated(view):
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            raise unauthorized()
        user = SqlServerStore().find_user_by_email(TokenService().subject(header[7:]))
        if not user:
            raise unauthorized()
        request.snapgasto_user = user
        return view(request, *args, **kwargs)
    return wrapped


def administrator(view):
    @authenticated
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        if request.snapgasto_user.role != "ADMIN":
            raise forbidden()
        return view(request, *args, **kwargs)
    return wrapped
