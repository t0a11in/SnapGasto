package cl.snapgasto.backend.dto;

/** Estado de un compromiso dentro del mes consultado. */
public enum CommitmentState {
    /** Aún debe salir dinero este mes. */
    PENDIENTE,
    /** Ya se registró el gasto o se completó el aporte sugerido. */
    REGISTRADO,
    /** El usuario omitió el gasto recurrente de este mes. */
    OMITIDO
}
