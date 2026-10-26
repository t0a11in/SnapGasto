package cl.snapgasto.backend.estudio;

import static org.junit.jupiter.api.Assertions.fail;
// Constructores de requests (get, post, delete) y verificadores de respuesta
// (status, jsonPath) de MockMvc.
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.jayway.jsonpath.JsonPath;

import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.repository.UserRepository;

/**
 * NIVEL 3 · Integración: la aplicación completa, sin mocks.
 *
 * <p>{@code @SpringBootTest} levanta la API entera (controladores, seguridad,
 * validaciones, servicios, JPA) con la base H2 en memoria definida en
 * {@code src/test/resources/application-test.yaml}. {@code MockMvc} envía
 * requests HTTP de mentira a esa API, sin abrir un puerto real.
 *
 * <p>Diferencia clave con el nivel 2:
 * <ul>
 *   <li>Nivel 2 (unitario): prueba UNA clase; las demás son mocks. Rápido y preciso.</li>
 *   <li>Nivel 3 (integración): prueba que TODO encaje: JSON → validación →
 *   seguridad JWT → servicio → base de datos → JSON. Más lento (segundos) pero
 *   detecta errores que los unitarios no ven (rutas, anotaciones, permisos).</li>
 * </ul>
 *
 * <p>Correr solo este archivo: {@code .\mvnw.cmd test -Dtest=Nivel3IntegracionTest}
 */
@SpringBootTest                 // levanta el contexto completo de Spring
@AutoConfigureMockMvc           // crea un MockMvc listo para inyectar
@ActiveProfiles("test")         // usa application-test.yaml (H2, secreto JWT de prueba)
@DisplayName("Nivel 3 · Integración")
class Nivel3IntegracionTest {

    // Correos usados por estos tests; se limpian antes y después de cada uno.
    private static final List<String> CORREOS = List.of("estudio-ana@example.com", "estudio-luis@example.com");

    // @Autowired: Spring inyecta los beans reales (ya no son mocks).
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseRepository expenseRepository;

    // La base H2 es compartida por todos los tests de integración, así que cada
    // test deja la base como la encontró. Se borran primero los gastos porque
    // tienen una clave foránea hacia el usuario.
    @BeforeEach   // se ejecuta antes de cada test
    void limpiarAntes() {
        limpiarDatosDeEstudio();
    }

    @AfterEach    // se ejecuta después de cada test, aunque haya fallado
    void limpiarDespues() {
        limpiarDatosDeEstudio();
    }

    private void limpiarDatosDeEstudio() {
        for (String correo : CORREOS) {
            userRepository.findByEmailIgnoreCase(correo).ifPresent(usuario -> {
                expenseRepository.deleteAll(expenseRepository.findAllByUserOrderByDateDescCreatedAtDesc(usuario));
                userRepository.delete(usuario);
            });
        }
    }

    /**
     * Registra una cuenta por HTTP y devuelve su token JWT. Es un ayudante: los
     * tests se leen mejor si la preparación repetida está en un método.
     */
    private String registrarYObtenerToken(String correo) throws Exception {
        // Un "text block" (""" ... """) permite escribir el JSON tal cual.
        String body = """
                { "fullName": "Persona de estudio", "email": "%s", "password": "clave-segura-123" }
                """.formatted(correo);

        String respuesta = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())               // 201
                .andReturn().getResponse().getContentAsString();

        // JsonPath lee un valor del JSON de respuesta: $.accessToken = campo "accessToken" en la raíz.
        return JsonPath.read(respuesta, "$.accessToken");
    }

    // =====================================================================
    // EJEMPLO 1: un flujo HTTP completo y verificación del JSON de respuesta.
    // =====================================================================

    @Test
    @DisplayName("Registrar una cuenta devuelve token y perfil (rol USER)")
    void registrarDevuelveTokenYPerfil() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "fullName": "Ana", "email": "estudio-ana@example.com", "password": "clave-segura-123" }
                                """))
                // Cada andExpect es un assert sobre la respuesta HTTP.
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value("estudio-ana@example.com"))
                .andExpect(jsonPath("$.user.role").value("USER"));
    }

    // =====================================================================
    // EJEMPLO 2: errores HTTP (401 y 400) tal como los vería el frontend.
    // =====================================================================

    @Test
    @DisplayName("Sin token, la API responde 401 con code UNAUTHORIZED")
    void sinTokenResponde401() throws Exception {
        mockMvc.perform(get("/api/expenses/v1/listar"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Contraseña incorrecta responde 401 con un mensaje claro")
    void contrasenaIncorrectaResponde401() throws Exception {
        registrarYObtenerToken("estudio-ana@example.com");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "email": "estudio-ana@example.com", "password": "otra-clave-999" }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Correo o contraseña incorrectos."));
    }

    @Test
    @DisplayName("Un monto en cero lo rechaza la validación (@DecimalMin) con 400")
    void montoCeroResponde400() throws Exception {
        String token = registrarYObtenerToken("estudio-ana@example.com");

        mockMvc.perform(post("/api/expenses/v1/crear")
                        // Así se envía el JWT, igual que lo hace Angular.
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "amount": 0, "category": "Café", "date": "%s", "paymentMethod": "EFECTIVO" }
                                """.formatted(LocalDate.now())))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("El monto debe ser mayor que cero."));
    }

    // =====================================================================
    // EJEMPLO 3: crear y luego leer, pasando por la base de datos real (H2).
    // =====================================================================

    @Test
    @DisplayName("Un gasto creado aparece en el listado de su mes")
    void gastoCreadoApareceEnElListado() throws Exception {
        String token = registrarYObtenerToken("estudio-ana@example.com");
        LocalDate hoy = LocalDate.now();

        mockMvc.perform(post("/api/expenses/v1/crear")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "amount": 15990, "category": "  Supermercado ", "date": "%s", "paymentMethod": "TARJETA" }
                                """.formatted(hoy)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.category").value("Supermercado"));   // el servicio limpió los espacios

        mockMvc.perform(get("/api/expenses/v1/listar")
                        .param("month", YearMonth.from(hoy).toString())     // ?month=AAAA-MM
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                // $.length() = cantidad de elementos del arreglo raíz.
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].amount").value(15990));
    }

    // =====================================================================
    // EJERCICIOS · Quita @Disabled, borra el fail(...) y escribe el test.
    // Soluciones: docs/estudio-tests/soluciones/Nivel3Soluciones.java
    // =====================================================================

    @Test
    @Disabled("Ejercicio 3.1")
    @DisplayName("Ejercicio 3.1 · Luis no puede borrar un gasto de Ana (404)")
    void ejercicio3_1() throws Exception {
        // Pista: registra a Ana y a Luis (usa los correos de CORREOS), Ana crea un
        // gasto y lee su id con JsonPath.read(respuesta, "$.id"). Luis llama a
        // delete("/api/expenses/v1/{id}/eliminar", id) con SU token → 404.
        // Importa MockMvcRequestBuilders.delete.
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 3.2")
    @DisplayName("Ejercicio 3.2 · Después de cerrar sesión, el token ya no sirve")
    void ejercicio3_2() throws Exception {
        // Pista: POST /api/auth/v1/logout con el token → 204 (status().isNoContent()).
        // Luego GET /api/auth/v1/token-status con el mismo token → 401.
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 3.3")
    @DisplayName("Ejercicio 3.3 · Una fecha futura responde 400")
    void ejercicio3_3() throws Exception {
        // Pista: igual que montoCeroResponde400, con LocalDate.now().plusDays(1)
        // y el mensaje "La fecha no puede ser futura.".
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 3.4")
    @DisplayName("Ejercicio 3.4 · Registrar dos veces el mismo correo responde 409")
    void ejercicio3_4() throws Exception {
        // Pista: registrarYObtenerToken(...) una vez y luego repite el POST a
        // /api/auth/register con el mismo correo → status().isConflict().
        fail("Ejercicio pendiente");
    }
}
