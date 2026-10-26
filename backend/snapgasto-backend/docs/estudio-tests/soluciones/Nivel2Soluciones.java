// SOLUCIONES · Nivel 2 (Mockito). Este archivo NO se compila: está fuera de src/.
// Copia lo necesario en src/test/java/cl/snapgasto/backend/estudio/Nivel2MockitoTest.java.
//
// Para los ejercicios 2.4 y 2.5 agrega estos imports en Nivel2MockitoTest:
//   import org.springframework.security.crypto.password.PasswordEncoder;
//   import cl.snapgasto.backend.admin.AdminUserService;
//   import cl.snapgasto.backend.dto.AdminUserRequest;
//   import cl.snapgasto.backend.entity.Role;
//   import cl.snapgasto.backend.repository.NotificationRepository;
//   import cl.snapgasto.backend.repository.UserRepository;
//
// Y estos @Mock como campos de la clase (junto a los que ya existen):
//   @Mock private UserRepository userRepository;
//   @Mock private NotificationRepository notificationRepository;
//   @Mock private PasswordEncoder passwordEncoder;
//
// Nota: un @Mock declarado y no usado en un test NO provoca error; lo que
// Mockito estricto rechaza es un when(...) que el test no llega a usar.

    // ---------------------------------------------------------------------
    // Ejercicio 2.1 · Sin mes, se usa el listado histórico completo
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 2.1 · Sin mes, se usa el listado histórico completo")
    void ejercicio2_1() {
        when(expenseRepository.findAllByUserOrderByDateDescCreatedAtDesc(ana))
                .thenReturn(List.of(gasto("Arriendo", "450000"), gasto("Luz", "32000")));

        List<ExpenseResponse> resultado = expenseService.listFor(ana, null);

        assertEquals(2, resultado.size());
        // any() en los tres argumentos: "con cualquier valor, nunca se llamó".
        verify(expenseRepository, never())
                .findAllByUserAndDateBetweenOrderByDateDescCreatedAtDesc(any(), any(), any());
    }

    // ---------------------------------------------------------------------
    // Ejercicio 2.2 · Actualizar cambia los datos del gasto existente
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 2.2 · Actualizar cambia los datos del gasto existente")
    void ejercicio2_2() {
        Expense existente = gasto("Supermercado", "45000");
        when(expenseRepository.findByIdAndUser(existente.getId(), ana)).thenReturn(Optional.of(existente));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(invocacion -> invocacion.getArgument(0));
        ExpenseRequest cambios = new ExpenseRequest(
                new BigDecimal("47500"), "Feria", LocalDate.of(2026, 2, 11), "Verduras", "EFECTIVO");

        ExpenseResponse respuesta = expenseService.update(existente.getId(), cambios, ana);

        assertEquals(existente.getId(), respuesta.id());          // mismo gasto, no uno nuevo
        assertEquals("Feria", respuesta.category());
        assertEquals(new BigDecimal("47500"), respuesta.amount());
        assertEquals("Verduras", respuesta.description());
    }

    // ---------------------------------------------------------------------
    // Ejercicio 2.3 · Borrar un gasto propio llama a delete con ESE gasto
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 2.3 · Borrar un gasto propio llama a delete con ESE gasto")
    void ejercicio2_3() {
        Expense propio = gasto("Café", "2500");
        when(expenseRepository.findByIdAndUser(propio.getId(), ana)).thenReturn(Optional.of(propio));

        expenseService.delete(propio.getId(), ana);

        // Sin comparadores, verify usa equals(): debe ser exactamente ese objeto.
        verify(expenseRepository).delete(propio);
    }

    // ---------------------------------------------------------------------
    // Ejercicio 2.4 · Un admin no puede eliminarse a sí mismo
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 2.4 · Un admin no puede eliminarse a sí mismo")
    void ejercicio2_4() {
        AdminUserService adminUserService =
                new AdminUserService(userRepository, expenseRepository, notificationRepository, passwordEncoder);
        AppUser admin = new AppUser();
        admin.setId(UUID.randomUUID());
        admin.setRole(Role.ADMIN);

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> adminUserService.delete(admin.getId(), admin));

        assertEquals(HttpStatus.BAD_REQUEST, error.getStatusCode());
        // La validación ocurre antes de tocar la base: ningún repositorio se usó.
        verifyNoInteractions(userRepository, expenseRepository, notificationRepository);
    }

    // ---------------------------------------------------------------------
    // Ejercicio 2.5 · Cambiar la contraseña la cifra y cierra las sesiones
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 2.5 · Cambiar la contraseña la cifra y cierra las sesiones")
    void ejercicio2_5() {
        AdminUserService adminUserService =
                new AdminUserService(userRepository, expenseRepository, notificationRepository, passwordEncoder);
        AppUser luis = new AppUser();
        luis.setId(UUID.randomUUID());
        luis.setFullName("Luis");
        luis.setEmail("luis@example.com");
        luis.setRole(Role.USER);
        luis.setPassword("hash-antiguo");

        when(userRepository.findById(luis.getId())).thenReturn(Optional.of(luis));
        when(userRepository.existsByEmailIgnoreCaseAndIdNot("luis@example.com", luis.getId())).thenReturn(false);
        // El PasswordEncoder también es un mock: no cifra de verdad, devuelve lo que le digamos.
        when(passwordEncoder.encode("nueva-clave-123")).thenReturn("hash-nuevo");

        adminUserService.update(luis.getId(),
                new AdminUserRequest("Luis", "luis@example.com", Role.USER, "nueva-clave-123"));

        assertEquals("hash-nuevo", luis.getPassword());
        // invalidateSessions() sube la versión de sesión de 0 a 1: los JWT viejos dejan de servir.
        assertEquals(1, luis.getSessionVersion());
    }
