// SOLUCIONES · Nivel 3 (Integración). Este archivo NO se compila: está fuera de src/.
// Copia lo necesario en src/test/java/cl/snapgasto/backend/estudio/Nivel3IntegracionTest.java.
//
// Import extra para el ejercicio 3.1:
//   import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;

    // ---------------------------------------------------------------------
    // Ejercicio 3.1 · Luis no puede borrar un gasto de Ana (404)
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 3.1 · Luis no puede borrar un gasto de Ana (404)")
    void ejercicio3_1() throws Exception {
        String tokenAna = registrarYObtenerToken("estudio-ana@example.com");
        String tokenLuis = registrarYObtenerToken("estudio-luis@example.com");

        // Ana crea un gasto y guardamos su id leyendo el JSON de la respuesta.
        String respuesta = mockMvc.perform(post("/api/expenses/v1/crear")
                        .header("Authorization", "Bearer " + tokenAna)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "amount": 9990, "category": "Cine", "date": "%s", "paymentMethod": "TARJETA" }
                                """.formatted(LocalDate.now())))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String idDelGasto = JsonPath.read(respuesta, "$.id");

        // Luis intenta borrarlo: para él ese gasto "no existe".
        mockMvc.perform(delete("/api/expenses/v1/{id}/eliminar", idDelGasto)
                        .header("Authorization", "Bearer " + tokenLuis))
                .andExpect(status().isNotFound());

        // Y el gasto de Ana sigue ahí.
        mockMvc.perform(get("/api/expenses/v1/listar")
                        .header("Authorization", "Bearer " + tokenAna))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    // ---------------------------------------------------------------------
    // Ejercicio 3.2 · Después de cerrar sesión, el token ya no sirve
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 3.2 · Después de cerrar sesión, el token ya no sirve")
    void ejercicio3_2() throws Exception {
        String token = registrarYObtenerToken("estudio-ana@example.com");

        mockMvc.perform(post("/api/auth/v1/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());   // 204

        mockMvc.perform(get("/api/auth/v1/token-status").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------------
    // Ejercicio 3.3 · Una fecha futura responde 400
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 3.3 · Una fecha futura responde 400")
    void ejercicio3_3() throws Exception {
        String token = registrarYObtenerToken("estudio-ana@example.com");

        mockMvc.perform(post("/api/expenses/v1/crear")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "amount": 5000, "category": "Viaje", "date": "%s", "paymentMethod": "TARJETA" }
                                """.formatted(LocalDate.now().plusDays(1))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("La fecha no puede ser futura."));
    }

    // ---------------------------------------------------------------------
    // Ejercicio 3.4 · Registrar dos veces el mismo correo responde 409
    // ---------------------------------------------------------------------
    @Test
    @DisplayName("Ejercicio 3.4 · Registrar dos veces el mismo correo responde 409")
    void ejercicio3_4() throws Exception {
        registrarYObtenerToken("estudio-ana@example.com");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                { "fullName": "Otra Ana", "email": "estudio-ana@example.com", "password": "clave-segura-123" }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value("Ya existe una cuenta con ese correo."));
    }
