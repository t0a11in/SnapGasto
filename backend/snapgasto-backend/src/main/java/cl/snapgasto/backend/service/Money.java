package cl.snapgasto.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.util.Locale;

/** Formato chileno para textos de avisos: $1.234.567 (miles con punto, sin decimales). */
public final class Money {

    private Money() {
    }

    public static String format(BigDecimal value) {
        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.ROOT);
        symbols.setGroupingSeparator('.');
        DecimalFormat format = new DecimalFormat("#,##0", symbols);
        BigDecimal amount = value == null ? BigDecimal.ZERO : value.setScale(0, RoundingMode.HALF_UP);
        return (amount.signum() < 0 ? "-$" : "$") + format.format(amount.abs());
    }
}
