package cl.snapgasto.backend.estudio;

// Los "import static" traen métodos sueltos para poder escribir assertEquals(...)
// en vez de Assertions.assertEquals(...). Es lo normal en JUnit.
import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.exception.TooManyRequestsException;
import cl.snapgasto.backend.security.BearerTokens;
import cl.snapgasto.backend.security.JwtService;
import cl.snapgasto.backend.security.LoginAttemptService;
import io.jsonwebtoken.Claims;

/**
 * NIVEL 1 · JUnit 5 puro.
 *
 * <p>Aquí no hay Spring, base de datos ni mocks: se crea un objeto con `new`,
 * se llama a un método y se revisa el resultado. Es el tipo de test más rápido
 * (milisegundos) y el que más vas a escribir.
 *
 * <p>Todos los tests siguen el patrón AAA:
 * <ul>
 *   <li><b>Arrange</b> (preparar): crear los objetos y datos de entrada.</li>
 *   <li><b>Act</b> (actuar): llamar UNA vez al método que se prueba.</li>
 *   <li><b>Assert</b> (verificar): comprobar el resultado esperado.</li>
 * </ul>
 *
 * <p>Cómo correr solo este archivo: {@code .\mvnw.cmd test -Dtest=Nivel1JUnitTest}
 */
// @DisplayName cambia el nombre que aparece en el reporte (por defecto sería el nombre del método).
@DisplayName("Nivel 1 · JUnit")
class Nivel1JUnitTest {

    // =====================================================================
    // EJEMPLO 1: el test más simple posible.
    // =====================================================================

    // @Test marca el método como un test. JUnit lo ejecuta automáticamente.
    // Los métodos de test no devuelven nada (void) y no reciben parámetros.
    @Test
    @DisplayName("Extrae el token de un header 'Bearer <token>'")
    void extraeElTokenDeUnHeaderBearer() {
        // Arrange: el valor que llegaría en el header Authorization.
        String header = "Bearer abc.def.ghi";

        // Act: se llama al método que queremos probar.
        String token = BearerTokens.extract(header);

        // Assert: assertEquals(esperado, real). ¡El orden importa! Si falla,
        // JUnit muestra "expected: <abc.def.ghi> but was: <...>".
        assertEquals("abc.def.ghi", token);
    }

    @Test
    @DisplayName("Devuelve null si el header no existe")
    void devuelveNullSiNoHayHeader() {
        // A veces Arrange y Act caben en una línea. assertNull verifica que el valor sea null.
        assertNull(BearerTokens.extract(null));
    }

    // =====================================================================
    // EJEMPLO 2: tests parametrizados (un mismo test con muchos datos).
    // =====================================================================

    // @ParameterizedTest ejecuta el test una vez por cada valor de la fuente.
    // @ValueSource entrega valores simples; @NullAndEmptySource agrega null y "".
    // En el reporte verás una ejecución por cada valor.
    @ParameterizedTest(name = "\"{0}\" no es un header Bearer válido")
    @NullAndEmptySource
    @ValueSource(strings = { "Basic dXNlcjpwYXNz", "bearer abc", "Bearer", "Token abc" })
    void rechazaHeadersQueNoSonBearer(String header) {
        assertNull(BearerTokens.extract(header));
    }

    // @CsvSource permite pasar varias columnas por caso: entrada y salida esperada.
    // Útil cuando cada caso tiene su propio resultado.
    @ParameterizedTest(name = "\"{0}\" → \"{1}\"")
    @CsvSource({
            "'Bearer abc', abc",
            "'Bearer   xyz   ', xyz",          // quita espacios sobrantes
            "'Bearer a.b.c', a.b.c",
    })
    void extraeVariosTokens(String header, String esperado) {
        assertEquals(esperado, BearerTokens.extract(header));
    }

    // =====================================================================
    // EJEMPLO 3: excepciones con assertThrows.
    // =====================================================================

    @Test
    @DisplayName("JwtService no acepta un secreto corto")
    void jwtServiceRechazaSecretoCorto() {
        // assertThrows(TipoDeExcepcion.class, () -> código) pasa SOLO si el código
        // lanza esa excepción. Si no lanza nada, el test falla.
        // La flecha "() -> ..." es una lambda: le pasamos a JUnit el código para
        // que él lo ejecute dentro de un try/catch.
        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> new JwtService("muy-corto", 120, 168));

        // assertThrows devuelve la excepción: así podemos revisar su mensaje.
        assertTrue(error.getMessage().contains("32"));
    }

    // =====================================================================
    // EJEMPLO 4: @BeforeEach y @Nested para agrupar tests relacionados.
    // =====================================================================

    // @Nested crea un grupo dentro del reporte. Cada clase anidada puede tener
    // su propio @BeforeEach con la preparación común de su grupo.
    @Nested
    @DisplayName("JwtService")
    class JwtServiceTests {

        private static final String SECRETO = "secreto-de-estudio-con-mas-de-treinta-y-dos-caracteres";

        private JwtService jwtService;
        private AppUser usuario;

        // @BeforeEach se ejecuta ANTES de CADA test de esta clase. Así cada test
        // parte con objetos nuevos y no depende de lo que hizo otro test.
        @BeforeEach
        void prepararObjetos() {
            jwtService = new JwtService(SECRETO, 120, 168);
            usuario = new AppUser();
            usuario.setEmail("ana@example.com");
        }

        @Test
        @DisplayName("El token generado se puede leer y trae el correo")
        void elTokenTraeElCorreo() {
            String token = jwtService.generateToken(usuario);

            Claims claims = jwtService.parseClaims(token);

            // assertAll ejecuta TODAS las verificaciones aunque una falle y luego
            // informa todos los errores juntos. Sin assertAll, el test se detiene
            // en el primer assert que falla.
            assertAll(
                    () -> assertEquals("ana@example.com", claims.getSubject()),
                    () -> assertEquals(0, jwtService.sessionVersion(claims)),
                    () -> assertTrue(claims.getExpiration().after(claims.getIssuedAt())));
        }

        @Test
        @DisplayName("Dos tokens seguidos nunca son iguales")
        void dosTokensSonDistintos() {
            assertNotEquals(jwtService.generateToken(usuario), jwtService.generateToken(usuario));
        }
    }

    @Nested
    @DisplayName("LoginAttemptService")
    class LoginAttemptTests {

        private LoginAttemptService intentos;

        @BeforeEach
        void prepararServicio() {
            // Constructor real: bloquea tras 3 fallos durante 15 minutos.
            intentos = new LoginAttemptService(3, 15);
        }

        @Test
        @DisplayName("Bloquea el correo al tercer fallo")
        void bloqueaAlTercerFallo() {
            intentos.recordFailure("ana@example.com");
            intentos.recordFailure("ana@example.com");
            // assertDoesNotThrow es lo contrario de assertThrows: falla si el código lanza algo.
            assertDoesNotThrow(() -> intentos.assertNotBlocked("ana@example.com"));

            intentos.recordFailure("ana@example.com");

            assertThrows(TooManyRequestsException.class, () -> intentos.assertNotBlocked("ana@example.com"));
        }
    }

    // =====================================================================
    // EJERCICIOS · Quita @Disabled, borra el fail(...) y escribe el test.
    // Soluciones: docs/estudio-tests/soluciones/Nivel1Soluciones.java
    // =====================================================================

    // @Disabled hace que JUnit salte el test (aparece como "skipped").
    // Sirve para dejar ejercicios pendientes sin romper la suite.
    @Test
    @Disabled("Ejercicio 1.1")
    @DisplayName("Ejercicio 1.1 · 'Bearer ' seguido solo de espacios devuelve null")
    void ejercicio1_1() {
        // Pista: arma el header "Bearer     " y usa assertNull.
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 1.2")
    @DisplayName("Ejercicio 1.2 · Un correo bloqueado no bloquea a otro correo")
    void ejercicio1_2() {
        // Pista: crea un LoginAttemptService(3, 15), registra 3 fallos para
        // "ana@example.com" y verifica que "luis@example.com" NO esté bloqueado.
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 1.3")
    @DisplayName("Ejercicio 1.3 · Un login exitoso reinicia el contador de fallos")
    void ejercicio1_3() {
        // Pista: 2 fallos → recordSuccess → 2 fallos más. Con máximo 3, ¿está bloqueado?
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 1.4")
    @DisplayName("Ejercicio 1.4 · JwtService rechaza expiración cero o negativa")
    void ejercicio1_4() {
        // Pista: convierte este test en @ParameterizedTest con @ValueSource(longs = {0, -5})
        // y usa assertThrows con new JwtService(secretoLargo, minutos, 168).
        fail("Ejercicio pendiente");
    }
}
