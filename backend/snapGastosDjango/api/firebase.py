from django.conf import settings

from .errors import ApiError, unauthorized


class FirebaseIdentityProvider:
    def verify(self, id_token):
        if not settings.FIREBASE_ENABLED:
            raise ApiError(503, "El acceso con Google no está configurado.")
        try:
            import firebase_admin
            from firebase_admin import auth, credentials
            if not firebase_admin._apps:
                firebase_admin.initialize_app(credentials.ApplicationDefault(), {"projectId": settings.FIREBASE_PROJECT_ID or None})
            decoded = auth.verify_id_token(id_token)
        except Exception as error:
            raise unauthorized("El token de Firebase no es válido.") from error
        if not decoded.get("email") or not decoded.get("email_verified") or decoded.get("firebase", {}).get("sign_in_provider") != "google.com":
            raise unauthorized("El token no corresponde a una cuenta Google verificada.")
        return {"uid": decoded["uid"], "email": decoded["email"].lower(), "displayName": decoded.get("name") or decoded["email"]}
