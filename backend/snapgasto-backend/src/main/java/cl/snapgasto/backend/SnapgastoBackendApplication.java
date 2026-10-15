package cl.snapgasto.backend;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.event.ApplicationEnvironmentPreparedEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.core.env.Environment;

@SpringBootApplication
public class SnapgastoBackendApplication {

	private static final Logger log = LoggerFactory.getLogger(SnapgastoBackendApplication.class);

	/** Punto de entrada de la API REST de SnapGasto. */
	public static void main(String[] args) {
		SpringApplication application = new SpringApplication(SnapgastoBackendApplication.class);
		application.addListeners(
				(ApplicationListener<ApplicationEnvironmentPreparedEvent>) event -> logStartupConfiguration(event.getEnvironment()));
		application.run(args);
	}

	/**
	 * Se ejecuta antes de crear el DataSource; permite detectar variables de
	 * conexión ausentes sin exponer contraseñas ni secretos JWT en los logs.
	 */
	private static void logStartupConfiguration(Environment environment) {
		log.info("Configuración de BBDD: DB_HOST={}, DB_PORT={}, DB_NAME={}, DB_USER={}, DB_PASSWORD={}",
				valueOrMissing(environment.getProperty("DB_HOST")),
				valueOrMissing(environment.getProperty("DB_PORT")),
				valueOrMissing(environment.getProperty("DB_NAME")),
				valueOrMissing(environment.getProperty("DB_USER")),
				isConfigured(environment.getProperty("DB_PASSWORD")) ? "configurada" : "FALTA");
		log.info("Configuración JWT_SECRET={}",
				isConfigured(environment.getProperty("JWT_SECRET")) ? "configurada" : "FALTA o se usará el valor por defecto");
	}

	private static String valueOrMissing(String value) {
		return isConfigured(value) ? value : "<FALTA>";
	}

	private static boolean isConfigured(String value) {
		return value != null && !value.isBlank();
	}

}
