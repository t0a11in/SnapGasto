package cl.snapgasto.backend.entity;

/** Estado de avance de un proyecto. */
public enum ProjectStatus {
    PLANIFICADO, EN_CURSO, PAUSADO, COMPLETADO, CANCELADO;

    /** Solo los proyectos activos generan compromisos, avisos y gastos recurrentes. */
    public boolean isActive() {
        return this == PLANIFICADO || this == EN_CURSO;
    }
}
