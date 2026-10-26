package cl.snapgasto.backend.config;

import java.time.Clock;
import java.time.ZoneId;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Reloj de negocio en la zona horaria de los usuarios (Chile por defecto), para
 * que "hoy" y "este mes" de los proyectos coincidan con lo que ve la persona.
 */
@Configuration
public class TimeConfig {

    @Bean
    public Clock businessClock(@Value("${app.time-zone:America/Santiago}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }
}
