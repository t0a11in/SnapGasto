package cl.snapgasto.backend.exception;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.server.ResponseStatusException;

import cl.snapgasto.backend.dto.ApiError;

/** Normaliza los errores de la API con la forma {"message": "..."}. */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("Los datos enviados no son válidos.");
        return ResponseEntity.badRequest().body(new ApiError(message));
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<ApiError> handleStatus(ResponseStatusException exception) {
        HttpStatus status = HttpStatus.valueOf(exception.getStatusCode().value());
        String message = exception.getReason() == null ? "La solicitud no pudo procesarse." : exception.getReason();
        return ResponseEntity.status(status).body(new ApiError(message));
    }

    @ExceptionHandler(TooManyRequestsException.class)
    ResponseEntity<ApiError> handleTooManyRequests(TooManyRequestsException exception) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .header(HttpHeaders.RETRY_AFTER, Long.toString(exception.getRetryAfterSeconds()))
                .body(new ApiError(exception.getMessage()));
    }

    /** Parámetro de URL con formato inválido (UUID, enum, número). */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException exception) {
        return ResponseEntity.badRequest().body(new ApiError("El parámetro '" + exception.getName() + "' no es válido."));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    ResponseEntity<ApiError> handleMissingParameter(MissingServletRequestParameterException exception) {
        return ResponseEntity.badRequest().body(new ApiError("Falta el parámetro '" + exception.getParameterName() + "'."));
    }

    /** Cuerpo JSON ilegible: valor de enum desconocido, fecha mal escrita, etc. */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException exception) {
        return ResponseEntity.badRequest().body(new ApiError("El cuerpo de la solicitud tiene un formato inválido."));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("Ocurrió un error interno."));
    }
}
