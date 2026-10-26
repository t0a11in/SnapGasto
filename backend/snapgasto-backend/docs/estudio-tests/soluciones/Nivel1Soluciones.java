// SOLUCIONES · Nivel 1 (JUnit). Este archivo NO se compila: está fuera de src/.
// Copia el cuerpo de cada método en el ejercicio correspondiente de
// src/test/java/cl/snapgasto/backend/estudio/Nivel1JUnitTest.java y quita @Disabled.
//
// Imports extra que podrías necesitar en Nivel1JUnitTest:
//   (ninguno: todos los usados aquí ya están importados en el archivo)

    // ---------------------------------------------------------------------
    // Ejercicio 1.1 · 'Bearer ' seguido solo de espacios devuelve null
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 1.1 · 'Bearer ' seguido solo de espacios devuelve null")
    void ejercicio1_1() {
        // Arrange: el prefijo está, pero después solo hay espacios.
        String header = "Bearer      ";

        // Act + Assert: BearerTokens hace trim() y, si queda vacío, devuelve null.
        assertNull(BearerTokens.extract(header));
    }

    // ---------------------------------------------------------------------
    // Ejercicio 1.2 · Un correo bloqueado no bloquea a otro correo
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 1.2 · Un correo bloqueado no bloquea a otro correo")
    void ejercicio1_2() {
        LoginAttemptService intentos = new LoginAttemptService(3, 15);

        // Tres fallos para Ana: queda bloqueada.
        for (int i = 0; i < 3; i++) {
            intentos.recordFailure("ana@example.com");
        }

        // Los contadores son por correo: Luis no debe verse afectado.
        assertThrows(TooManyRequestsException.class, () -> intentos.assertNotBlocked("ana@example.com"));
        assertDoesNotThrow(() -> intentos.assertNotBlocked("luis@example.com"));
    }

    // ---------------------------------------------------------------------
    // Ejercicio 1.3 · Un login exitoso reinicia el contador de fallos
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 1.3 · Un login exitoso reinicia el contador de fallos")
    void ejercicio1_3() {
        LoginAttemptService intentos = new LoginAttemptService(3, 15);

        intentos.recordFailure("ana@example.com");
        intentos.recordFailure("ana@example.com");
        intentos.recordSuccess("ana@example.com");   // vuelve a cero
        intentos.recordFailure("ana@example.com");
        intentos.recordFailure("ana@example.com");

        // Lleva 2 fallos desde el éxito (no 4): con máximo 3, sigue sin bloqueo.
        assertDoesNotThrow(() -> intentos.assertNotBlocked("ana@example.com"));
    }

    // ---------------------------------------------------------------------
    // Ejercicio 1.4 · JwtService rechaza expiración cero o negativa
    // Cambia @Test por @ParameterizedTest y agrega el parámetro al método.
    // ---------------------------------------------------------------------
    @ParameterizedTest(name = "expiración de {0} minutos")
    @ValueSource(longs = { 0, -5 })
    @DisplayName("Ejercicio 1.4 · JwtService rechaza expiración cero o negativa")
    void ejercicio1_4(long minutos) {
        String secretoLargo = "secreto-de-estudio-con-mas-de-treinta-y-dos-caracteres";

        assertThrows(IllegalArgumentException.class, () -> new JwtService(secretoLargo, minutos, 168));
    }
