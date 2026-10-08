package cl.snapgasto.backend.security;

import java.util.Map;
import java.util.Locale;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.google.firebase.FirebaseApp;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;

/** Valida tokens Firebase y acepta exclusivamente identidades iniciadas con Google. */
@Service
public class FirebaseTokenVerifier {

    private final ObjectProvider<FirebaseApp> firebaseAppProvider;

    public FirebaseTokenVerifier(ObjectProvider<FirebaseApp> firebaseAppProvider) {
        this.firebaseAppProvider = firebaseAppProvider;
    }

    public FirebaseIdentity verifyGoogleToken(String idToken) {
        FirebaseApp firebaseApp = firebaseAppProvider.getIfAvailable();
        if (firebaseApp == null) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "El acceso con Google no está configurado en el servidor.");
        }

        try {
            // La comprobación de revocación se realiza solo en el canje de inicio
            // de sesión, no en cada solicitud normal protegida por nuestro JWT.
            FirebaseToken token = FirebaseAuth.getInstance(firebaseApp).verifyIdToken(idToken, true);
            if (!wasSignedInWithGoogle(token) || !isVerifiedEmail(token)) {
                throw invalidToken();
            }

            String email = token.getEmail();
            if (email == null || email.isBlank()) {
                throw invalidToken();
            }
            String displayName = token.getName();
            return new FirebaseIdentity(token.getUid(), email.trim().toLowerCase(Locale.ROOT),
                    displayName == null || displayName.isBlank() ? email : displayName.trim());
        } catch (FirebaseAuthException exception) {
            throw invalidToken();
        }
    }

    private boolean wasSignedInWithGoogle(FirebaseToken token) {
        Object firebaseClaim = token.getClaims().get("firebase");
        if (!(firebaseClaim instanceof Map<?, ?> claims)) {
            return false;
        }
        return "google.com".equals(claims.get("sign_in_provider"));
    }

    private boolean isVerifiedEmail(FirebaseToken token) {
        return Boolean.TRUE.equals(token.getClaims().get("email_verified"));
    }

    private ResponseStatusException invalidToken() {
        return new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                "La sesión de Google no es válida o expiró.");
    }
}
