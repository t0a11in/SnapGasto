# Guía de estudio: JUnit 5 y Mockito con SnapGasto

Tres niveles, de lo más simple a lo más completo, usando el código real del backend.
Cada nivel es un archivo de test con **ejemplos que ya funcionan** (léelos y córrelos)
y **ejercicios** marcados con `@Disabled` para que no rompan la suite.

| Nivel | Archivo | Qué aprendes |
|---|---|---|
| 1 · JUnit | `src/test/java/cl/snapgasto/backend/estudio/Nivel1JUnitTest.java` | `@Test`, patrón AAA, `assertEquals`, `assertThrows`, `@BeforeEach`, `@ParameterizedTest`, `assertAll`, `@Nested` |
| 2 · Mockito | `.../estudio/Nivel2MockitoTest.java` | `@Mock`, `@InjectMocks`, `when/thenReturn`, `thenAnswer`, `thenThrow`, `verify`, `never`, `ArgumentCaptor` |
| 3 · Integración | `.../estudio/Nivel3IntegracionTest.java` | `@SpringBootTest`, `MockMvc`, requests HTTP con JWT, `jsonPath`, base H2 |

Soluciones: `docs/estudio-tests/soluciones/` (fuera de `src/`, no se compilan). Intenta cada
ejercicio antes de mirarlas.

## Cómo correrlos

```powershell
# Todo el backend
.\mvnw.cmd test

# Un nivel
.\mvnw.cmd test -Dtest=Nivel1JUnitTest

# Un solo test (Clase#método)
.\mvnw.cmd test -Dtest=Nivel2MockitoTest#crearLimpiaLosTextos

# Todos los de estudio
.\mvnw.cmd test -Dtest="cl.snapgasto.backend.estudio.*"
```

En VS Code (con la extensión *Test Runner for Java*) aparece un ▶ junto a cada `@Test` y
la vista **Testing** muestra el árbol con los `@DisplayName`.

## Cómo hacer un ejercicio

1. Quita la línea `@Disabled("Ejercicio X.Y")`.
2. Borra `fail("Ejercicio pendiente");` y escribe el test siguiendo la pista.
3. Córrelo. **Primero debe fallar si rompes el código a propósito**: cambia algo en la
   clase probada (por ejemplo un `3` por un `4`) y verifica que tu test lo detecta.
   Un test que nunca falla no prueba nada.
4. Compara con la solución.

## Conceptos clave

**Patrón AAA.** Todo test tiene tres partes: *Arrange* (preparar datos), *Act* (llamar una
vez al método probado) y *Assert* (verificar). Si un test hace dos "Act", probablemente son
dos tests.

**`assertEquals(esperado, real)`.** El orden importa para que el mensaje de error se lea bien.

**Unitario vs. integración.**
- *Unitario* (niveles 1 y 2): una clase, sin Spring ni base. Milisegundos. Si falla, el
  error está en esa clase.
- *Integración* (nivel 3): la app completa con H2. Segundos. Detecta errores de rutas,
  anotaciones, seguridad y JSON que los unitarios no ven.
- Regla práctica: muchos unitarios, pocos de integración para los flujos importantes.

**Mock.** Objeto falso que reemplaza una dependencia (por ejemplo un repositorio).
- `when(mock.metodo(args)).thenReturn(valor)` → qué responde.
- `verify(mock).metodo(args)` → que se llamó (una vez).
- `verify(mock, never()).metodo(any())` → que NO se llamó.
- `ArgumentCaptor` → atrapar el objeto que se le pasó para revisarlo.
- Lo que no configuras devuelve valores vacíos: `null`, `0`, `false`, listas vacías,
  `Optional.empty()`.

**Mockito estricto.** Con `@ExtendWith(MockitoExtension.class)`, un `when(...)` que el test
no usa hace fallar el test (`UnnecessaryStubbingException`). Borra la línea sobrante.

**`@Mock` vs. `@Autowired`.** `@Mock` = falso (niveles 2). `@Autowired` = el objeto real que
crea Spring (nivel 3). No se mezclan en el mismo test sin una buena razón.

## Errores comunes

| Mensaje | Causa probable |
|---|---|
| `expected: <X> but was: <Y>` | El valor real no es el esperado (o invertiste los argumentos). |
| `Wanted but not invoked` | `verify(...)` de un método que no se llamó o se llamó con otros argumentos. |
| `UnnecessaryStubbingException` | Un `when(...)` que el test no usa. |
| `NullPointerException` en el servicio | Falta un `when(...)`: el mock devolvió `null`. |
| `Status expected:<200> but was:<401>` | Falta el header `Authorization: Bearer <token>`. |
| `Status expected:<201> but was:<400>` | El JSON no pasó la validación: revisa `$.message`. |

## Siguiente paso

Cuando termines, lee los tests reales del proyecto con la misma mirada:
`security/LoginAttemptServiceTest` (reloj falso), `service/AuthServiceTest` (Mockito con
seguridad), `controller/TokenRefreshEndpointIntegrationTest` (integración con JWT).
Después intenta escribir los tests que faltan, por ejemplo para `CategoryService` o
`NotificationService`.
