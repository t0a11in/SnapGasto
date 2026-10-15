package cl.snapgasto.backend.config;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Test;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.security.SecurityScheme;

class OpenApiConfigTest {

    private final OpenApiConfig openApiConfig = new OpenApiConfig();

    @Test
    void createsDocumentationWithJwtBearerAuthentication() {
        OpenAPI openApi = openApiConfig.snapGastoOpenApi();

        assertEquals("SnapGasto API", openApi.getInfo().getTitle());
        assertEquals("v1", openApi.getInfo().getVersion());
        assertNotNull(openApi.getComponents().getSecuritySchemes());

        SecurityScheme bearerAuth = openApi.getComponents().getSecuritySchemes().get("bearerAuth");
        assertNotNull(bearerAuth);
        assertEquals(SecurityScheme.Type.HTTP, bearerAuth.getType());
        assertEquals("bearer", bearerAuth.getScheme());
        assertEquals("JWT", bearerAuth.getBearerFormat());
    }
}
