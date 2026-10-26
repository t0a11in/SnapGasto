package cl.snapgasto.backend.estudio;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.fail;
// Métodos de Mockito: when (definir respuesta), verify (comprobar llamada),
// never/times (cuántas veces), any/eq (comparadores de argumentos).
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.ExpenseRequest;
import cl.snapgasto.backend.dto.ExpenseResponse;
import cl.snapgasto.backend.entity.AppUser;
import cl.snapgasto.backend.entity.Expense;
import cl.snapgasto.backend.repository.ExpenseRepository;
import cl.snapgasto.backend.service.ExpenseService;
import cl.snapgasto.backend.service.GroupAccessService;

/**
 * NIVEL 2 · Mockito: probar una clase aislada de sus dependencias.
 *
 * <p>{@link ExpenseService} usa un {@link ExpenseRepository} (base de datos) y un
 * {@link GroupAccessService}. Para probar SOLO la lógica del servicio, los
 * reemplazamos por <b>mocks</b>: objetos falsos que
 * <ul>
 *   <li>no hacen nada por sí solos (devuelven null, listas vacías, false, 0…);</li>
 *   <li>responden lo que les indiquemos con {@code when(...).thenReturn(...)};</li>
 *   <li>recuerdan cómo los llamaron, para revisarlo con {@code verify(...)}.</li>
 * </ul>
 *
 * <p>Así el test no necesita base de datos, es rápido y si falla sabemos que el
 * error está en el servicio, no en otra parte.
 *
 * <p>Ojo: {@code MockitoExtension} es "estricta". Si defines un {@code when(...)}
 * que el test nunca usa, el test falla con {@code UnnecessaryStubbingException}.
 * Es intencional: te obliga a no dejar preparación inútil.
 *
 * <p>Correr solo este archivo: {@code .\mvnw.cmd test -Dtest=Nivel2MockitoTest}
 */
// Activa Mockito en JUnit 5: crea los @Mock y los inyecta en @InjectMocks antes de cada test.
@ExtendWith(MockitoExtension.class)
@DisplayName("Nivel 2 · Mockito")
class Nivel2MockitoTest {

    // @Mock crea un objeto falso de esa interfaz/clase. Uno nuevo para cada test.
    @Mock
    private ExpenseRepository expenseRepository;

    @Mock
    private GroupAccessService groupAccessService;

    // @InjectMocks crea un ExpenseService REAL y le pasa los mocks de arriba por
    // su constructor. Equivale a: new ExpenseService(expenseRepository, groupAccessService).
    @InjectMocks
    private ExpenseService expenseService;

    private AppUser ana;

    @BeforeEach
    void prepararUsuario() {
        ana = new AppUser();
        ana.setId(UUID.randomUUID());
        ana.setEmail("ana@example.com");
    }

    /** Ayudante para no repetir la construcción de gastos en cada test. */
    private Expense gasto(String categoria, String monto) {
        Expense expense = new Expense();
        expense.setId(UUID.randomUUID());
        expense.setUser(ana);
        expense.setCategory(categoria);
        expense.setAmount(new BigDecimal(monto));
        expense.setDate(LocalDate.of(2026, 2, 10));
        expense.setPaymentMethod("TARJETA");
        return expense;
    }

    // =====================================================================
    // EJEMPLO 1: when(...).thenReturn(...) y comparadores eq(...).
    // =====================================================================

    @Test
    @DisplayName("Listar febrero consulta del 1 al 28 y transforma a respuesta")
    void listarUnMesConsultaSusLimites() {
        // Arrange: le decimos al mock qué responder. Con eq(...) exigimos los
        // argumentos exactos: si el servicio pidiera otras fechas, el mock no
        // respondería la lista (devolvería una vacía) y el test fallaría.
        Expense supermercado = gasto("Supermercado", "45000");
        when(expenseRepository.findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(
                eq(ana), eq(LocalDate.of(2026, 2, 1)), eq(LocalDate.of(2026, 2, 28))))
                .thenReturn(List.of(supermercado));

        // Act
        List<ExpenseResponse> resultado = expenseService.listFor(ana, "2026-02");

        // Assert: el servicio convirtió la entidad a ExpenseResponse.
        assertEquals(1, resultado.size());
        assertEquals("Supermercado", resultado.get(0).category());
        assertEquals(new BigDecimal("45000"), resultado.get(0).amount());
    }

    // =====================================================================
    // EJEMPLO 2: verificar que algo NO se llamó.
    // =====================================================================

    @Test
    @DisplayName("Un mes mal escrito responde 400 y ni siquiera consulta la base")
    void mesInvalidoNoConsultaLaBase() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> expenseService.listFor(ana, "febrero"));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        // verifyNoInteractions: el mock no recibió NINGUNA llamada. Prueba que
        // el servicio valida antes de ir a la base de datos.
        verifyNoInteractions(expenseRepository);
    }

    // =====================================================================
    // EJEMPLO 3: ArgumentCaptor para inspeccionar lo que se guardó.
    // =====================================================================

    @Test
    @DisplayName("Crear un gasto limpia los textos antes de guardar")
    void crearLimpiaLosTextos() {
        // thenAnswer permite responder con lógica: aquí, devolver el mismo
        // objeto que recibió save(...), como haría la base de datos.
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("12990"), "  Farmacia  ", LocalDate.of(2026, 2, 3), "   ", " EFECTIVO ");

        expenseService.create(request, ana);

        // Un ArgumentCaptor "atrapa" el argumento con que se llamó al mock,
        // para revisarlo después con asserts normales.
        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        verify(expenseRepository).save(captor.capture());
        Expense guardado = captor.getValue();

        assertEquals("Farmacia", guardado.getCategory());   // sin espacios
        assertEquals("EFECTIVO", guardado.getPaymentMethod());
        assertNull(guardado.getDescription());               // "   " pasa a null
        assertSame(ana, guardado.getUser());                 // assertSame: el MISMO objeto
        assertNull(guardado.getExpenseGroup());              // sin grupo
        // Como no había groupId, el servicio no debió consultar grupos.
        verifyNoInteractions(groupAccessService);
    }

    // =====================================================================
    // EJEMPLO 4: Optional.empty() y never().
    // =====================================================================

    @Test
    @DisplayName("No se puede borrar un gasto ajeno (404) y no se borra nada")
    void noBorraUnGastoAjeno() {
        UUID idAjeno = UUID.randomUUID();
        // La consulta filtra por dueño: para Ana, ese gasto "no existe".
        when(expenseRepository.findByIdAndUser(idAjeno, ana)).thenReturn(Optional.empty());

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> expenseService.delete(idAjeno, ana));

        assertEquals(HttpStatus.NOT_FOUND, error.getStatusCode());
        // never() = times(0). any() acepta cualquier argumento.
        verify(expenseRepository, never()).delete(any());
    }

    // =====================================================================
    // EJEMPLO 5: thenThrow para simular que una dependencia falla.
    // =====================================================================

    @Test
    @DisplayName("Si Ana no pertenece al grupo, el gasto no se guarda")
    void grupoAjenoNoGuarda() {
        UUID grupoAjeno = UUID.randomUUID();
        // thenThrow hace que el mock lance una excepción cuando lo llamen.
        when(groupAccessService.requireMember(grupoAjeno, ana))
                .thenThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, "No perteneces a este grupo."));
        ExpenseRequest request = new ExpenseRequest(
                new BigDecimal("8000"), "Pizza", LocalDate.of(2026, 2, 3), null, "TARJETA", grupoAjeno);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> expenseService.create(request, ana));

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
        verify(groupAccessService, times(1)).requireMember(grupoAjeno, ana);
        verify(expenseRepository, never()).save(any());
    }

    // =====================================================================
    // EJERCICIOS · Quita @Disabled, borra el fail(...) y escribe el test.
    // Soluciones: docs/estudio-tests/soluciones/Nivel2Soluciones.java
    // =====================================================================

    @Test
    @Disabled("Ejercicio 2.1")
    @DisplayName("Ejercicio 2.1 · Sin mes, se usa el listado histórico completo")
    void ejercicio2_1() {
        // Pista: stub de findAllByUserOrderByDateDescCreatedAtDesc(ana), llama a
        // listFor(ana, null) y verifica con never() que NO se llamó al de fechas
        // (usa any() en sus tres argumentos).
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 2.2")
    @DisplayName("Ejercicio 2.2 · Actualizar cambia los datos del gasto existente")
    void ejercicio2_2() {
        // Pista: findByIdAndUser(id, ana) devuelve Optional.of(gasto(...)),
        // save(...) devuelve su argumento (thenAnswer), llama a update(...)
        // y revisa la respuesta: nueva categoría y nuevo monto.
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 2.3")
    @DisplayName("Ejercicio 2.3 · Borrar un gasto propio llama a delete con ESE gasto")
    void ejercicio2_3() {
        // Pista: verify(expenseRepository).delete(elMismoGasto).
        fail("Ejercicio pendiente");
    }

    // Los ejercicios 2.4 y 2.5 son sobre AdminUserService, que aún no tiene tests.
    // Créalo tú mismo con new AdminUserService(userRepo, expenseRepo, notificationRepo, passwordEncoder),
    // usando @Mock para cada dependencia (declara los @Mock que falten en esta clase).

    @Test
    @Disabled("Ejercicio 2.4")
    @DisplayName("Ejercicio 2.4 · Un admin no puede eliminarse a sí mismo")
    void ejercicio2_4() {
        // Pista: delete(admin.getId(), admin) → 400. Luego verifyNoInteractions
        // sobre userRepository: no debió ni buscarlo.
        fail("Ejercicio pendiente");
    }

    @Test
    @Disabled("Ejercicio 2.5")
    @DisplayName("Ejercicio 2.5 · Cambiar la contraseña la cifra y cierra las sesiones")
    void ejercicio2_5() {
        // Pista: when(passwordEncoder.encode("nueva-clave-123")).thenReturn("hash"),
        // userRepository.findById → Optional.of(usuario), existsByEmailIgnoreCaseAndIdNot → false.
        // Llama a update(...) y verifica: getPassword() == "hash" y getSessionVersion() == 1.
        fail("Ejercicio pendiente");
    }
}
