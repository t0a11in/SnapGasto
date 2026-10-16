from datetime import date
from decimal import Decimal, InvalidOperation
from uuid import UUID

from .errors import bad_request


def required_text(value, field: str, maximum: int = 1000) -> str:
    if not isinstance(value, str) or not value.strip():
        raise bad_request(f"El campo {field} es obligatorio.")
    value = value.strip()
    if len(value) > maximum:
        raise bad_request(f"El campo {field} supera el máximo permitido.")
    return value


def optional_text(value, field: str, maximum: int):
    if value is None or value == "":
        return None
    return required_text(value, field, maximum)


def normalized_email(value) -> str:
    value = required_text(value, "correo", 180).lower()
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise bad_request("El correo no es válido.")
    return value


def validated_password(value, required: bool = True):
    if value in (None, "") and not required:
        return None
    value = required_text(value, "contraseña", 100)
    if len(value) < 8:
        raise bad_request("La contraseña debe tener al menos 8 caracteres.")
    return value


def validated_money(value) -> Decimal:
    try:
        parsed = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise bad_request("El monto debe ser mayor que cero.")
    if parsed <= 0:
        raise bad_request("El monto debe ser mayor que cero.")
    return parsed.quantize(Decimal("0.01"))


def validated_date(value) -> date:
    try:
        parsed = date.fromisoformat(value)
    except (TypeError, ValueError):
        raise bad_request("La fecha es obligatoria.")
    if parsed > date.today():
        raise bad_request("La fecha no puede ser futura.")
    return parsed


def validated_month(value) -> date:
    if value in (None, ""):
        today = date.today()
        return date(today.year, today.month, 1)
    if not isinstance(value, str) or len(value) != 7:
        raise bad_request("El mes debe usar el formato AAAA-MM.")
    try:
        return date.fromisoformat(f"{value}-01")
    except ValueError:
        raise bad_request("El mes debe usar el formato AAAA-MM.")


def validated_income_type(value) -> str:
    if value not in ("TARJETA", "FISICO"):
        raise bad_request("El tipo de ingreso debe ser TARJETA o FISICO.")
    return value


def validated_uuid(value, field: str = "identificador") -> UUID:
    try:
        return UUID(str(value))
    except (TypeError, ValueError, AttributeError):
        raise bad_request(f"El {field} no es válido.")
