package cl.snapgasto.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/** Habilita las tareas periódicas de limpieza (tokens revocados, intentos de login). */
@Configuration
@EnableScheduling
public class SchedulingConfig {
}
