package cl.snapgasto.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityScheme;

/** Configura los metadatos y la autenticación JWT de la documentación OpenAPI. */
@Configuration
public class OpenApiConfig {

    @Bean
    OpenAPI snapGastoOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("SnapGasto API")
                        .version("v1")
                        .description("API REST para autenticación, gastos y administración de SnapGasto."))
                .components(new Components().addSecuritySchemes("bearerAuth", new SecurityScheme()
                        .type(SecurityScheme.Type.HTTP)
                        .scheme("bearer")
                        .bearerFormat("JWT")
                        .description("Pega el token JWT obtenido mediante /api/auth/login.")));
    }
}
