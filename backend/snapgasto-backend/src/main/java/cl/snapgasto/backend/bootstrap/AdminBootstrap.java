package cl.snapgasto.backend.bootstrap;

import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import cl.snapgasto.backend.entity.Role;
import cl.snapgasto.backend.repository.UserRepository;

/** Promueve de forma explícita una cuenta existente a ADMIN durante el arranque. */
@Component
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final String adminEmail;

    public AdminBootstrap(UserRepository userRepository, @Value("${app.bootstrap.admin-email:}") String adminEmail) {
        this.userRepository = userRepository;
        this.adminEmail = adminEmail;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments arguments) {
        if (adminEmail == null || adminEmail.isBlank()) {
            return;
        }
        userRepository.findByEmailIgnoreCase(adminEmail.trim().toLowerCase(Locale.ROOT))
                .ifPresent(user -> user.setRole(Role.ADMIN));
    }
}
