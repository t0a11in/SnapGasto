package cl.snapgasto.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SnapgastoBackendApplication {

	/** Punto de entrada de la API REST de SnapGasto. */
	public static void main(String[] args) {
		SpringApplication.run(SnapgastoBackendApplication.class, args);
	}

}
